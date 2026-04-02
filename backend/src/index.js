import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
const port = process.env.BACKEND_PORT || 8080;

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "isg_user",
  password: process.env.DB_PASSWORD || "isg_password",
  database: process.env.DB_NAME || "isg_db"
});

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

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
