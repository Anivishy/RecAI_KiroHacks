import { randomBytes, randomUUID } from "node:crypto";
import { ensureRecruiterAuthSchema } from "./recruiter-auth";
import { query, withConnection } from "./recruiter-database";

export type RecruiterJobPosting = {
  id: string;
  recruiterId: string;
  title: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  inviteCode: string;
  candidateCount: number;
  createdAt: string;
};

type JobPostingRow = {
  id: string;
  recruiter_id: string;
  title: string;
  location: string;
  employment_type: string;
  experience_level: string;
  invite_code: string;
  candidate_count: string;
  created_at: Date;
};

let jobsSchemaBootstrapPromise: Promise<void> | null = null;

function mapJobPosting(row: JobPostingRow): RecruiterJobPosting {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    title: row.title,
    location: row.location,
    employmentType: row.employment_type,
    experienceLevel: row.experience_level,
    inviteCode: row.invite_code,
    candidateCount: Number(row.candidate_count ?? 0),
    createdAt: row.created_at.toISOString(),
  };
}

export async function ensureRecruiterJobsSchema() {
  if (jobsSchemaBootstrapPromise) {
    return jobsSchemaBootstrapPromise;
  }

  jobsSchemaBootstrapPromise = (async () => {
    await ensureRecruiterAuthSchema();

    await withConnection(async (client) => {
      await client.query("BEGIN");

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS job_postings (
            id TEXT PRIMARY KEY,
            recruiter_id TEXT NOT NULL REFERENCES recruiter_accounts(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            location TEXT NOT NULL DEFAULT 'Remote',
            employment_type TEXT NOT NULL DEFAULT 'Full-time',
            experience_level TEXT NOT NULL DEFAULT 'Mid-level',
            invite_code TEXT NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS job_postings_recruiter_id_idx
          ON job_postings (recruiter_id)
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS job_postings_invite_code_idx
          ON job_postings (invite_code)
        `);

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });
  })().catch((error) => {
    jobsSchemaBootstrapPromise = null;
    throw error;
  });

  return jobsSchemaBootstrapPromise;
}

export async function getJobPostingsForRecruiter(
  recruiterId: string,
): Promise<RecruiterJobPosting[]> {
  await ensureRecruiterJobsSchema();

  const result = await query<JobPostingRow>(
    `
      SELECT
        id, recruiter_id, title, location, employment_type,
        experience_level, invite_code, created_at,
        0 AS candidate_count
      FROM job_postings
      WHERE recruiter_id = $1
      ORDER BY created_at DESC
    `,
    [recruiterId],
  );

  return result.rows.map(mapJobPosting);
}

export async function getJobPostingById(
  jobId: string,
  recruiterId: string,
): Promise<RecruiterJobPosting | null> {
  await ensureRecruiterJobsSchema();

  const result = await query<JobPostingRow>(
    `
      SELECT
        id, recruiter_id, title, location, employment_type,
        experience_level, invite_code, created_at,
        0 AS candidate_count
      FROM job_postings
      WHERE id = $1 AND recruiter_id = $2
      LIMIT 1
    `,
    [jobId, recruiterId],
  );

  return result.rows[0] ? mapJobPosting(result.rows[0]) : null;
}

export async function createJobPosting(
  recruiterId: string,
  data: {
    title: string;
    location?: string;
    employmentType?: string;
    experienceLevel?: string;
  },
): Promise<RecruiterJobPosting> {
  await ensureRecruiterJobsSchema();

  const id = randomUUID();
  const inviteCode = randomBytes(6).toString("base64url");

  const result = await query<JobPostingRow>(
    `
      INSERT INTO job_postings (
        id, recruiter_id, title, location, employment_type,
        experience_level, invite_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, recruiter_id, title, location, employment_type,
        experience_level, invite_code, created_at,
        0 AS candidate_count
    `,
    [
      id,
      recruiterId,
      data.title.trim(),
      data.location?.trim() || "Remote",
      data.employmentType?.trim() || "Full-time",
      data.experienceLevel?.trim() || "Mid-level",
      inviteCode,
    ],
  );

  return mapJobPosting(result.rows[0]);
}

export async function deleteJobPosting(
  jobId: string,
  recruiterId: string,
): Promise<void> {
  await ensureRecruiterJobsSchema();

  await query(
    `DELETE FROM job_postings WHERE id = $1 AND recruiter_id = $2`,
    [jobId, recruiterId],
  );
}

export async function updateJobPosting(
  jobId: string,
  recruiterId: string,
  data: {
    title?: string;
    location?: string;
    employmentType?: string;
    experienceLevel?: string;
  },
): Promise<RecruiterJobPosting | null> {
  await ensureRecruiterJobsSchema();

  const result = await query<JobPostingRow>(
    `
      UPDATE job_postings
      SET
        title = COALESCE(NULLIF(TRIM($3), ''), title),
        location = COALESCE(NULLIF(TRIM($4), ''), location),
        employment_type = COALESCE(NULLIF(TRIM($5), ''), employment_type),
        experience_level = COALESCE(NULLIF(TRIM($6), ''), experience_level),
        updated_at = NOW()
      WHERE id = $1 AND recruiter_id = $2
      RETURNING
        id, recruiter_id, title, location, employment_type,
        experience_level, invite_code, created_at,
        0 AS candidate_count
    `,
    [
      jobId,
      recruiterId,
      data.title ?? "",
      data.location ?? "",
      data.employmentType ?? "",
      data.experienceLevel ?? "",
    ],
  );

  return result.rows[0] ? mapJobPosting(result.rows[0]) : null;
}
