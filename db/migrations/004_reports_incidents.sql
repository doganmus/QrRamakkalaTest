CREATE TABLE IF NOT EXISTS incident_types (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO incident_types (code, name, is_active)
VALUES
  ('NEAR_MISS', 'Ramak Kala', TRUE),
  ('HAZARD', 'Tehlikeli Durum', TRUE),
  ('ACCIDENT', 'İş Kazası', TRUE),
  ('NON_COMPLIANCE', 'Uygunsuzluk', TRUE),
  ('ENVIRONMENT', 'Çevre Olayı', TRUE),
  ('OTHER', 'Diğer', TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  qr_code_id BIGINT NOT NULL REFERENCES qr_codes(id) ON DELETE RESTRICT,
  location_id BIGINT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  reporter_mode VARCHAR(20) NOT NULL DEFAULT 'ANONYMOUS',
  reporter_phone_masked VARCHAR(30),
  description TEXT NOT NULL,
  has_injury BOOLEAN NOT NULL DEFAULT FALSE,
  needs_emergency BOOLEAN NOT NULL DEFAULT FALSE,
  gps_lat NUMERIC(10, 7),
  gps_lng NUMERIC(10, 7),
  status_code VARCHAR(30) NOT NULL DEFAULT 'NEW',
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_incident_types (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  incident_type_id BIGINT NOT NULL REFERENCES incident_types(id) ON DELETE RESTRICT,
  UNIQUE(report_id, incident_type_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_qr_code_id ON reports(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_reports_location_id ON reports(location_id);
