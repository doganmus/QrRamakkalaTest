CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(30) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(120) NOT NULL,
  role_code VARCHAR(50) NOT NULL,
  auth_type VARCHAR(20) NOT NULL,
  access_token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_subject ON auth_sessions(subject);
