import express from "express";
import cors from "cors";
import pg from "pg";
import crypto from "crypto";

const app = express();
const port = process.env.BACKEND_PORT || 8080;
const otpTtlSeconds = Number(process.env.OTP_TTL_SECONDS || 300);
const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS || 86400);
const adminEmail = process.env.ADMIN_EMAIL || "admin@isg.local";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const mediaUploadBaseUrl = process.env.MEDIA_UPLOAD_BASE_URL || "http://localhost:9000/isg-media";

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "isg_user",
  password: process.env.DB_PASSWORD || "isg_password",
  database: process.env.DB_NAME || "isg_db"
});

const otpStore = new Map();
const sessionStore = new Map();

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !sessionStore.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const session = sessionStore.get(token);
  if (session.expiresAt < nowInSeconds()) {
    sessionStore.delete(token);
    return res.status(401).json({ message: "Session expired" });
  }

  req.session = session;
  return next();
}

function roleRequired(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.session?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

function isAdminOrExpert(req, res, next) {
  return roleRequired(["SUPER_ADMIN", "EHS_EXPERT"])(req, res, next);
}

app.get("/api/v1/health", async (_req, res) => {
  try {
    const db = await pool.query("SELECT NOW() AS now");
    res.json({
      status: "ok",
      service: "backend",
      time: new Date().toISOString(),
      dbTime: db.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      service: "backend",
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.post("/api/v1/auth/otp/request", (req, res) => {
  const phone = req.body?.phone;
  if (!phone) {
    return res.status(400).json({ message: "phone is required" });
  }

  const code = generateOtp();
  otpStore.set(phone, {
    code,
    expiresAt: nowInSeconds() + otpTtlSeconds
  });

  return res.json({
    status: "ok",
    message: "OTP generated",
    expiresIn: otpTtlSeconds,
    // NOTE: Demo amaçlı döndürülüyor. Gerçek ortamda döndürülmemeli.
    code
  });
});

app.post("/api/v1/auth/otp/verify", (req, res) => {
  const phone = req.body?.phone;
  const code = req.body?.code;
  if (!phone || !code) {
    return res.status(400).json({ message: "phone and code are required" });
  }

  const otpRecord = otpStore.get(phone);
  if (!otpRecord || otpRecord.expiresAt < nowInSeconds() || otpRecord.code !== code) {
    return res.status(401).json({ message: "Invalid or expired OTP" });
  }

  otpStore.delete(phone);
  const token = generateToken();
  sessionStore.set(token, {
    userId: `phone:${phone}`,
    role: "VIEWER",
    authType: "OTP",
    expiresAt: nowInSeconds() + sessionTtlSeconds
  });

  return res.json({
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: sessionTtlSeconds,
    role: "VIEWER"
  });
});

app.post("/api/v1/auth/login", (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken();
  sessionStore.set(token, {
    userId: "admin:1",
    role: "SUPER_ADMIN",
    authType: "PASSWORD",
    expiresAt: nowInSeconds() + sessionTtlSeconds
  });

  return res.json({
    accessToken: token,
    tokenType: "Bearer",
    expiresIn: sessionTtlSeconds,
    role: "SUPER_ADMIN"
  });
});

app.get("/api/v1/auth/me", authRequired, (req, res) => {
  return res.json({
    userId: req.session.userId,
    role: req.session.role,
    authType: req.session.authType,
    expiresAt: req.session.expiresAt
  });
});

app.get("/api/v1/admin/rbac-check", authRequired, roleRequired(["SUPER_ADMIN", "EHS_EXPERT"]), (_req, res) => {
  return res.json({ message: "RBAC check passed" });
});

app.get("/api/v1/locations", authRequired, isAdminOrExpert, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.name, l.code, l.department_id, d.name AS department_name,
              l.latitude, l.longitude, l.is_active, l.created_at
       FROM locations l
       LEFT JOIN departments d ON d.id = l.department_id
       ORDER BY l.id DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list locations", error: error.message });
  }
});

app.post("/api/v1/locations", authRequired, isAdminOrExpert, async (req, res) => {
  const { name, code, departmentId, latitude, longitude } = req.body || {};
  if (!name || !code) {
    return res.status(400).json({ message: "name and code are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO locations (name, code, department_id, latitude, longitude, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, name, code, department_id, latitude, longitude, is_active, created_at`,
      [name, code, departmentId || null, latitude || null, longitude || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create location", error: error.message });
  }
});

app.patch("/api/v1/locations/:id", authRequired, isAdminOrExpert, async (req, res) => {
  const locationId = Number(req.params.id);
  const { name, code, departmentId, latitude, longitude, isActive } = req.body || {};
  if (!locationId) {
    return res.status(400).json({ message: "invalid location id" });
  }

  try {
    const result = await pool.query(
      `UPDATE locations
       SET name = COALESCE($2, name),
           code = COALESCE($3, code),
           department_id = COALESCE($4, department_id),
           latitude = COALESCE($5, latitude),
           longitude = COALESCE($6, longitude),
           is_active = COALESCE($7, is_active)
       WHERE id = $1
       RETURNING id, name, code, department_id, latitude, longitude, is_active, created_at`,
      [locationId, name ?? null, code ?? null, departmentId ?? null, latitude ?? null, longitude ?? null, isActive ?? null]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Location not found" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update location", error: error.message });
  }
});

app.get("/api/v1/qr-codes", authRequired, isAdminOrExpert, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.id, q.location_id, q.label, q.token, q.is_active, q.created_at,
              l.name AS location_name, l.code AS location_code
       FROM qr_codes q
       JOIN locations l ON l.id = q.location_id
       ORDER BY q.id DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list qr codes", error: error.message });
  }
});

app.post("/api/v1/qr-codes", authRequired, isAdminOrExpert, async (req, res) => {
  const { locationId, label } = req.body || {};
  if (!locationId || !label) {
    return res.status(400).json({ message: "locationId and label are required" });
  }

  const token = generateToken();
  try {
    const result = await pool.query(
      `INSERT INTO qr_codes (location_id, label, token, is_active, created_by)
       VALUES ($1, $2, $3, TRUE, NULL)
       RETURNING id, location_id, label, token, is_active, created_at`,
      [locationId, label, token]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create qr code", error: error.message });
  }
});

app.patch("/api/v1/qr-codes/:id/active", authRequired, isAdminOrExpert, async (req, res) => {
  const qrId = Number(req.params.id);
  const isActive = req.body?.isActive;
  if (!qrId || typeof isActive !== "boolean") {
    return res.status(400).json({ message: "id and isActive(boolean) are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE qr_codes
       SET is_active = $2
       WHERE id = $1
       RETURNING id, location_id, label, token, is_active, created_at`,
      [qrId, isActive]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "QR code not found" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update qr code state", error: error.message });
  }
});

app.get("/api/v1/public/qr/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const result = await pool.query(
      `SELECT q.id, q.label, q.token, q.is_active,
              l.id AS location_id, l.name AS location_name, l.code AS location_code, l.is_active AS location_active
       FROM qr_codes q
       JOIN locations l ON l.id = q.location_id
       WHERE q.token = $1
       LIMIT 1`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "QR not found" });
    }

    const qr = result.rows[0];
    if (!qr.is_active || !qr.location_active) {
      return res.status(410).json({ message: "QR inactive" });
    }

    return res.json({
      qrId: qr.id,
      label: qr.label,
      token: qr.token,
      location: {
        id: qr.location_id,
        name: qr.location_name,
        code: qr.location_code
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to validate QR", error: error.message });
  }
});

app.get("/api/v1/public/incident-types", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, name
       FROM incident_types
       WHERE is_active = TRUE
       ORDER BY id`
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list incident types", error: error.message });
  }
});

app.post("/api/v1/public/reports", async (req, res) => {
  const {
    qrToken,
    incidentTypeCodes,
    description,
    hasInjury = false,
    needsEmergency = false,
    gpsLat = null,
    gpsLng = null,
    reporterMode = "ANONYMOUS",
    reporterPhoneMasked = null
  } = req.body || {};

  if (!qrToken) {
    return res.status(400).json({ message: "qrToken is required" });
  }

  if (!Array.isArray(incidentTypeCodes) || incidentTypeCodes.length < 1) {
    return res.status(400).json({ message: "incidentTypeCodes must include at least one type" });
  }

  if (!description || description.trim().length < 20) {
    return res.status(400).json({ message: "description must be at least 20 characters" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const qrResult = await client.query(
      `SELECT q.id, q.is_active, l.id AS location_id, l.is_active AS location_active
       FROM qr_codes q
       JOIN locations l ON l.id = q.location_id
       WHERE q.token = $1
       LIMIT 1`,
      [qrToken]
    );

    if (qrResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "QR not found" });
    }

    const qr = qrResult.rows[0];
    if (!qr.is_active || !qr.location_active) {
      await client.query("ROLLBACK");
      return res.status(410).json({ message: "QR inactive" });
    }

    const incidentTypesResult = await client.query(
      `SELECT id, code
       FROM incident_types
       WHERE is_active = TRUE AND code = ANY($1::text[])`,
      [incidentTypeCodes]
    );

    if (incidentTypesResult.rowCount !== incidentTypeCodes.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "One or more incident type codes are invalid" });
    }

    const reportResult = await client.query(
      `INSERT INTO reports
         (qr_code_id, location_id, reporter_mode, reporter_phone_masked, description, has_injury, needs_emergency, gps_lat, gps_lng, status_code)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'NEW')
       RETURNING id, qr_code_id, location_id, reporter_mode, description, has_injury, needs_emergency, gps_lat, gps_lng, status_code, reported_at`,
      [
        qr.id,
        qr.location_id,
        reporterMode,
        reporterPhoneMasked,
        description.trim(),
        Boolean(hasInjury),
        Boolean(needsEmergency),
        gpsLat,
        gpsLng
      ]
    );

    const report = reportResult.rows[0];

    for (const incidentType of incidentTypesResult.rows) {
      await client.query(
        `INSERT INTO report_incident_types (report_id, incident_type_id)
         VALUES ($1, $2)`,
        [report.id, incidentType.id]
      );
    }

    await client.query("COMMIT");
    return res.status(201).json({
      reportId: report.id,
      status: report.status_code,
      qrCodeId: report.qr_code_id,
      locationId: report.location_id,
      incidentTypes: incidentTypesResult.rows.map((item) => item.code),
      reportedAt: report.reported_at
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create report", error: error.message });
  } finally {
    client.release();
  }
});

app.get("/api/v1/media-rules", authRequired, isAdminOrExpert, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT mr.id, it.code AS incident_type_code, it.name AS incident_type_name,
              mr.photo_required, mr.video_allowed, mr.max_video_seconds, mr.max_file_size_mb
       FROM media_rules mr
       JOIN incident_types it ON it.id = mr.incident_type_id
       ORDER BY it.id`
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to list media rules", error: error.message });
  }
});

app.put("/api/v1/media-rules/:incidentTypeCode", authRequired, roleRequired(["SUPER_ADMIN"]), async (req, res) => {
  const incidentTypeCode = req.params.incidentTypeCode;
  const { photoRequired, videoAllowed, maxVideoSeconds, maxFileSizeMb } = req.body || {};

  try {
    const incidentTypeResult = await pool.query(
      `SELECT id FROM incident_types WHERE code = $1 LIMIT 1`,
      [incidentTypeCode]
    );
    if (incidentTypeResult.rowCount === 0) {
      return res.status(404).json({ message: "incident type not found" });
    }

    const incidentTypeId = incidentTypeResult.rows[0].id;
    const result = await pool.query(
      `UPDATE media_rules
       SET photo_required = COALESCE($2, photo_required),
           video_allowed = COALESCE($3, video_allowed),
           max_video_seconds = COALESCE($4, max_video_seconds),
           max_file_size_mb = COALESCE($5, max_file_size_mb),
           updated_at = NOW()
       WHERE incident_type_id = $1
       RETURNING id, incident_type_id, photo_required, video_allowed, max_video_seconds, max_file_size_mb`,
      [incidentTypeId, photoRequired ?? null, videoAllowed ?? null, maxVideoSeconds ?? null, maxFileSizeMb ?? null]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "media rule not found" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update media rule", error: error.message });
  }
});

app.post("/api/v1/public/reports/:id/media/presign", async (req, res) => {
  const reportId = Number(req.params.id);
  const {
    mediaType,
    mimeType,
    fileSizeBytes,
    durationSeconds = null
  } = req.body || {};

  if (!reportId) {
    return res.status(400).json({ message: "invalid report id" });
  }
  if (!["PHOTO", "VIDEO"].includes(mediaType)) {
    return res.status(400).json({ message: "mediaType must be PHOTO or VIDEO" });
  }
  if (!fileSizeBytes || Number(fileSizeBytes) <= 0) {
    return res.status(400).json({ message: "fileSizeBytes must be > 0" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reportResult = await client.query(`SELECT id FROM reports WHERE id = $1 LIMIT 1`, [reportId]);
    if (reportResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "report not found" });
    }

    const rulesResult = await client.query(
      `SELECT COALESCE(MIN(mr.max_file_size_mb), 25) AS max_file_size_mb,
              COALESCE(MIN(mr.max_video_seconds), 30) AS max_video_seconds,
              COALESCE(BOOL_AND(mr.video_allowed), TRUE) AS video_allowed
       FROM report_incident_types rit
       JOIN media_rules mr ON mr.incident_type_id = rit.incident_type_id
       WHERE rit.report_id = $1`,
      [reportId]
    );
    const rules = rulesResult.rows[0];
    const maxBytes = Number(rules.max_file_size_mb) * 1024 * 1024;

    if (Number(fileSizeBytes) > maxBytes) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `File too large. Max ${rules.max_file_size_mb} MB` });
    }

    if (mediaType === "VIDEO") {
      if (!rules.video_allowed) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Video is not allowed for selected incident type(s)" });
      }
      if (durationSeconds && Number(durationSeconds) > Number(rules.max_video_seconds)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: `Video too long. Max ${rules.max_video_seconds} seconds` });
      }
    }

    const objectKey = `${reportId}/${Date.now()}-${generateToken()}`;
    const mediaInsert = await client.query(
      `INSERT INTO report_media
         (report_id, media_type, object_key, file_size_bytes, mime_type, duration_seconds, upload_status)
       VALUES
         ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING id, object_key, upload_status`,
      [reportId, mediaType, objectKey, fileSizeBytes, mimeType || null, durationSeconds || null]
    );

    await client.query("COMMIT");
    const media = mediaInsert.rows[0];
    return res.json({
      mediaId: media.id,
      objectKey: media.object_key,
      uploadUrl: `${mediaUploadBaseUrl}/${media.object_key}`,
      method: "PUT",
      requiredHeaders: {
        "Content-Type": mimeType || "application/octet-stream"
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create presign", error: error.message });
  } finally {
    client.release();
  }
});

app.post("/api/v1/public/reports/:id/media/complete", async (req, res) => {
  const reportId = Number(req.params.id);
  const { mediaId, thumbnailKey = null } = req.body || {};
  if (!reportId || !mediaId) {
    return res.status(400).json({ message: "report id and mediaId are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE report_media
       SET upload_status = 'COMPLETED',
           thumbnail_key = COALESCE($3, thumbnail_key),
           completed_at = NOW()
       WHERE id = $1 AND report_id = $2
       RETURNING id, report_id, media_type, object_key, thumbnail_key, upload_status, completed_at`,
      [mediaId, reportId, thumbnailKey]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "media not found" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Failed to complete upload", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
