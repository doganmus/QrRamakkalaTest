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

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
