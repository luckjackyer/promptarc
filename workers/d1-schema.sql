CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_email_created
ON auth_challenges (email, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_hash TEXT NOT NULL UNIQUE,
  csrf_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
ON sessions (user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  quota_period TEXT NOT NULL DEFAULT 'day',
  quota_limit INTEGER NOT NULL DEFAULT 5,
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  payment_provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_sessions (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL UNIQUE,
  user_id TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

-- Membership generation writes must bind user_id and should not rely on anonymous_id.
-- anonymous_id remains only for pre-membership rollback and legacy records.
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

CREATE TABLE IF NOT EXISTS quota_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  units INTEGER NOT NULL,
  generation_request_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quota_events_user_created
ON quota_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS generation_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  ratio TEXT,
  requested_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_generation_requests_user_created
ON generation_requests (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  target_user_id TEXT,
  action TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created
ON admin_audit_log (created_at DESC);

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

CREATE TABLE IF NOT EXISTS admin_gallery_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  source_label TEXT NOT NULL DEFAULT 'Admin upload',
  source_url TEXT,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_gallery_items_created ON admin_gallery_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_gallery_items_category ON admin_gallery_items (category, created_at DESC);

CREATE TABLE IF NOT EXISTS gallery_deletions (
  id TEXT PRIMARY KEY,
  reason TEXT,
  created_at TEXT NOT NULL
);
