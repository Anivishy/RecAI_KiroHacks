CREATE TABLE IF NOT EXISTS candidate_ai_summary (
  candidate_id  TEXT PRIMARY KEY,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  paragraphs    JSONB NOT NULL,
  model         TEXT NOT NULL,
  rec_count     INTEGER NOT NULL
);
