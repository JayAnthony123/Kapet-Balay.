"use strict";
/**
 * Kape't Balay - entry point.
 *   npm start   ->  http://localhost:3000
 */
const express = require("express");

const config = require("./backend/config/env");
const db = require("./backend/config/db");
const routes = require("./backend/routes");
const { HttpError, errorHandler } = require("./backend/middleware/error.middleware");

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

/* ---------- API ---------- */
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", express.json({ limit: "100kb" }), routes);
app.use("/api", (req, res, next) => next(new HttpError(404, "Not found.")));

/* ---------- Frontend (frontend/customer) ---------- */
app.use(express.static(config.CUSTOMER_DIR, { index: false }));
app.get("/", (req, res) => {
  // `root` makes this work even if your folder path contains a dot-folder
  res.sendFile("index.html", { root: config.CUSTOMER_HTML_DIR });
});

app.use(errorHandler);

/* ---------- start ---------- */
async function start() {
  try {
    await db.ping();
  } catch (err) {
    console.error(`\nCould not connect to MySQL: ${err.message}\n`);
    console.error("  1. Start MySQL (XAMPP Control Panel -> MySQL -> Start)");
    console.error("  2. Check DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in your .env file");
    console.error("  3. In phpMyAdmin, import database/kapet_balay_db.sql and then database/002_customer_ordering.sql\n");
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    console.log(`Kape't Balay running at http://localhost:${config.PORT}`);
    console.log(`Database: ${config.DB.database} @ ${config.DB.host}:${config.DB.port}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") console.error(`\nPort ${config.PORT} is already in use. Change PORT in .env or close the other program.\n`);
    else console.error(err);
    process.exit(1);
  });
}

if (require.main === module) start();

module.exports = app;
