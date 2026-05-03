import { randomBytes, randomUUID } from "node:crypto";
import { ensureRecruiterAuthSchema } from "./recruiter-auth";
import { ensureCandidateAuthSchema } from "@recai/candidate/server/candidate-auth";
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

export type CandidateJoinedPosting = {
  jobId: string;
  title: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  inviteCode: string;
  joinedAt: string;
};

export type JobPostingCandidateMembership = {
  candidateId: string;
  candidateName: string;
  candidateSlug: string;
  joinedAt: string;
};

export type JoinPostingResult = {
  posting: CandidateJoinedPosting | null;
  status: "already-joined" | "invalid-invite" | "joined";
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

type CandidateJoinedPostingRow = {
  id: string;
  title: string;
  location: string;
  employment_type: string;
  experience_level: string;
  invite_code: string;
  joined_at: Date;
};

type JobPostingCandidateMembershipRow = {
  candidate_id: string;
  candidate_name: string;
  candidate_slug: string;
  joined_at: Date;
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

function mapCandidateJoinedPosting(
  row: CandidateJoinedPostingRow,
): CandidateJoinedPosting {
  return {
    jobId: row.id,
    title: row.title,
    location: row.location,
    employmentType: row.employment_type,
    experienceLevel: row.experience_level,
    inviteCode: row.invite_code,
    joinedAt: row.joined_at.toISOString(),
  };
}

function mapJobPostingCandidateMembership(
  row: JobPostingCandidateMembershipRow,
): JobPostingCandidateMembership {
  return {
    candidateId: row.candidate_id,
    candidateName: row.candidate_name,
    candidateSlug: row.candidate_slug,
    joinedAt: row.joined_at.toISOString(),
  };
}

export async function ensureRecruiterJobsSchema() {
  if (jobsSchemaBootstrapPromise) {
    return jobsSchemaBootstrapPromise;
  }

  jobsSchemaBootstrapPromise = (async () => {
    await ensureRecruiterAuthSchema();
    await ensureCandidateAuthSchema();

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

        await client.query(`
          CREATE TABLE IF NOT EXISTS posting_candidates (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
            candidate_id TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(job_id, candidate_id)
          )
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS posting_candidates_job_id_idx
          ON posting_candidates (job_id)
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS posting_candidates_candidate_id_idx
          ON posting_candidates (candidate_id)
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
        job_postings.id,
        job_postings.recruiter_id,
        job_postings.title,
        job_postings.location,
        job_postings.employment_type,
        job_postings.experience_level,
        job_postings.invite_code,
        job_postings.created_at,
        COALESCE(candidate_counts.candidate_count, 0)::text AS candidate_count
      FROM job_postings
      LEFT JOIN (
        SELECT job_id, COUNT(*)::int AS candidate_count
        FROM posting_candidates
        GROUP BY job_id
      ) AS candidate_counts
        ON candidate_counts.job_id = job_postings.id
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
        job_postings.id,
        job_postings.recruiter_id,
        job_postings.title,
        job_postings.location,
        job_postings.employment_type,
        job_postings.experience_level,
        job_postings.invite_code,
        job_postings.created_at,
        COALESCE(candidate_counts.candidate_count, 0)::text AS candidate_count
      FROM job_postings
      LEFT JOIN (
        SELECT job_id, COUNT(*)::int AS candidate_count
        FROM posting_candidates
        GROUP BY job_id
      ) AS candidate_counts
        ON candidate_counts.job_id = job_postings.id
      WHERE job_postings.id = $1 AND job_postings.recruiter_id = $2
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

export async function joinCandidateToPostingByInviteCode(
  candidateId: string,
  inviteCode: string,
): Promise<JoinPostingResult> {
  await ensureRecruiterJobsSchema();

  const postingResult = await query<CandidateJoinedPostingRow>(
    `
      SELECT
        id,
        title,
        location,
        employment_type,
        experience_level,
        invite_code,
        NOW() AS joined_at
      FROM job_postings
      WHERE invite_code = $1
      LIMIT 1
    `,
    [inviteCode],
  );

  const posting = postingResult.rows[0];

  if (!posting) {
    return {
      posting: null,
      status: "invalid-invite",
    };
  }

  const insertResult = await query<{ joined_at: Date }>(
    `
      INSERT INTO posting_candidates (id, job_id, candidate_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (job_id, candidate_id) DO NOTHING
      RETURNING joined_at
    `,
    [randomUUID(), posting.id, candidateId],
  );

  return {
    posting: mapCandidateJoinedPosting({
      ...posting,
      joined_at: insertResult.rows[0]?.joined_at ?? posting.joined_at,
    }),
    status: insertResult.rowCount ? "joined" : "already-joined",
  };
}

export async function getJoinedPostingsForCandidate(
  candidateId: string,
): Promise<CandidateJoinedPosting[]> {
  await ensureRecruiterJobsSchema();

  const result = await query<CandidateJoinedPostingRow>(
    `
      SELECT
        job_postings.id,
        job_postings.title,
        job_postings.location,
        job_postings.employment_type,
        job_postings.experience_level,
        job_postings.invite_code,
        posting_candidates.joined_at
      FROM posting_candidates
      INNER JOIN job_postings
        ON job_postings.id = posting_candidates.job_id
      WHERE posting_candidates.candidate_id = $1
      ORDER BY posting_candidates.joined_at DESC
    `,
    [candidateId],
  );

  return result.rows.map(mapCandidateJoinedPosting);
}

export async function getJoinedCandidatesForPosting(
  jobId: string,
): Promise<JobPostingCandidateMembership[]> {
  await ensureRecruiterJobsSchema();

  const result = await query<JobPostingCandidateMembershipRow>(
    `
      SELECT
        candidate_accounts.id AS candidate_id,
        candidate_accounts.full_name AS candidate_name,
        candidate_accounts.slug AS candidate_slug,
        posting_candidates.joined_at
      FROM posting_candidates
      INNER JOIN candidate_accounts
        ON candidate_accounts.id = posting_candidates.candidate_id
      WHERE posting_candidates.job_id = $1
      ORDER BY posting_candidates.joined_at DESC
    `,
    [jobId],
  );

  return result.rows.map(mapJobPostingCandidateMembership);
}

export async function getPostingIdsForCandidate(candidateId: string): Promise<string[]> {
  await ensureRecruiterJobsSchema();
  const result = await query<{ job_id: string }>(
    `SELECT job_id FROM posting_candidates WHERE candidate_id = $1`,
    [candidateId],
  );
  return result.rows.map((r) => r.job_id);
}
