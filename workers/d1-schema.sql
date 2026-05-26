CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_sessions (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  anonymous_id TEXT,
  prompt TEXT NOT NULL,
  final_prompt TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  ratio TEXT,
  category TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  visibility TEXT NOT NULL DEFAULT 'public-unlisted',
  quality_score INTEGER,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_generations_user_created ON generations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_anonymous_created ON generations (anonymous_id, created_at DESC);

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  anonymous_id TEXT,
  event_type TEXT NOT NULL,
  cost_units INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_user_created ON usage_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_anonymous_created ON usage_events (anonymous_id, created_at DESC);

CREATE TABLE IF NOT EXISTS gallery_submissions (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL,
  user_id TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  published_slug TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_gallery_submissions_status ON gallery_submissions (review_status, created_at DESC);
