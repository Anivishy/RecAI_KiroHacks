import { attachDatabasePool } from "@vercel/functions";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { Signer } from "@aws-sdk/rds-signer";
import type { ClientBase, QueryResult, QueryResultRow } from "pg";
import { Pool } from "pg";

const REQUIRED_AURORA_ENV_KEYS = [
  "AWS_REGION",
  "AWS_ROLE_ARN",
  "PGHOST",
  "PGPORT",
  "PGUSER",
  "PGDATABASE",
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

function getAuroraConfig(): AuroraConfig {
  const missingKeys = getMissingAuroraEnvKeys();

  if (missingKeys.length > 0) {
    throw new Error(
      `RecAI candidate auth is not connected to Aurora PostgreSQL yet. Missing environment variables: ${missingKeys.join(
        ", ",
      )}. Accept the AWS marketplace install, attach Aurora to this Vercel project, then run \`vercel env pull\` locally.`,
    );
  }

  return {
    database: process.env.PGDATABASE ?? "postgres",
    host: process.env.PGHOST as string,
    port: Number(process.env.PGPORT),
    region: process.env.AWS_REGION as string,
    roleArn: process.env.AWS_ROLE_ARN as string,
    user: process.env.PGUSER as string,
  };
}

export function isCandidateDatabaseConfigured() {
  return getMissingAuroraEnvKeys().length === 0;
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
