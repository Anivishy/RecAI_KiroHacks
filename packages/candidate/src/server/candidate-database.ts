import { attachDatabasePool } from "@vercel/functions";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import type { ClientBase, QueryResult, QueryResultRow } from "pg";
import { Pool } from "pg";

const REQUIRED_AURORA_ENV_KEYS = [
  "PROD_AWS_REGION",
  "PROD_AWS_ROLE_ARN",
  "PROD_PGHOST",
  "PROD_PGPORT",
  "PROD_PGUSER",
  "PROD_PGDATABASE",
] as const;

type AuroraConfig = {
  database: string;
  host: string;
  port: number;
  region: string;
  roleArn: string;
  user: string;
};

let pool: Pool | null = null;

function getMissingAuroraEnvKeys() {
  return REQUIRED_AURORA_ENV_KEYS.filter((key) => !process.env[key]);
}

function isProvisioningHost(host: string | undefined) {
  return !host || host === "provisioning";
}

function getAuroraConfig(): AuroraConfig {
  const missingKeys = getMissingAuroraEnvKeys();
  const resolvedHost = process.env.PROD_PGHOST;

  if (missingKeys.length > 0 || isProvisioningHost(resolvedHost)) {
    const missingDetails =
      missingKeys.length > 0
        ? `Missing environment variables: ${missingKeys.join(", ")}.`
        : "The Aurora host is still provisioning.";

    throw new Error(
      `RecAI candidate auth is not connected to Aurora PostgreSQL yet. ${missingDetails} Wait for the AWS for Vercel resource to finish provisioning, then redeploy and run \`vercel env pull\` locally if needed.`,
    );
  }

  return {
    database: process.env.PROD_PGDATABASE ?? "postgres",
    host: resolvedHost as string,
    port: Number(process.env.PROD_PGPORT),
    region: process.env.PROD_AWS_REGION as string,
    roleArn: process.env.PROD_AWS_ROLE_ARN as string,
    user: process.env.PROD_PGUSER as string,
  };
}

export function isCandidateDatabaseConfigured() {
  return (
    getMissingAuroraEnvKeys().length === 0 &&
    !isProvisioningHost(process.env.PROD_PGHOST)
  );
}

function getPool() {
  if (pool) {
    return pool;
  }

  const config = getAuroraConfig();

  const signer = new Signer({
    hostname: config.host,
    port: config.port,
    username: config.user,
    region: config.region,
    credentials: awsCredentialsProvider({
      roleArn: config.roleArn,
      clientConfig: {
        region: config.region,
      },
    }),
  });

  pool = new Pool({
    host: config.host,
    user: config.user,
    database: config.database,
    password: () => signer.getAuthToken(),
    port: config.port,
    ssl: {
      rejectUnauthorized: false,
    },
    max: process.env.NODE_ENV === "production" ? 20 : 6,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  attachDatabasePool(pool);

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  values: unknown[] = [],
) {
  return getPool().query<T>(sql, values);
}

export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>) {
  const client = await getPool().connect();

  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export type { QueryResult };
