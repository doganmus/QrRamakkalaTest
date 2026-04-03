CREATE TABLE IF NOT EXISTS media_rules (
  id BIGSERIAL PRIMARY KEY,
  incident_type_id BIGINT NOT NULL REFERENCES incident_types(id) ON DELETE CASCADE,
  photo_required BOOLEAN NOT NULL DEFAULT FALSE,
  video_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  max_video_seconds INT NOT NULL DEFAULT 30,
  max_file_size_mb INT NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (incident_type_id)
);

INSERT INTO media_rules (incident_type_id, photo_required, video_allowed, max_video_seconds, max_file_size_mb)
SELECT id,
       CASE WHEN code = 'ACCIDENT' THEN TRUE ELSE FALSE END,
       TRUE,
       30,
       25
FROM incident_types
ON CONFLICT (incident_type_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS report_media (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL,
  object_key VARCHAR(255) NOT NULL,
  thumbnail_key VARCHAR(255),
  duration_seconds INT,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  upload_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT chk_report_media_type CHECK (media_type IN ('PHOTO', 'VIDEO'))
);

CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON report_media(report_id);
