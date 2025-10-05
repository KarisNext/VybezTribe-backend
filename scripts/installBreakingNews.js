// File: scripts/installBreakingNews.js
const fs = require("fs");
const path = require("path");
const { getPool, closePool } = require("../config/db");

(async () => {
  const pool = getPool();
  try {
    // Load the SQL file
    const sqlFilePath = path.join(__dirname, "../breakingnews.sql");
    const sql = fs.readFileSync(sqlFilePath, "utf8");

    // Run the SQL
    await pool.query(sql);
    console.log("✅ breaking_news table installed successfully");
  } catch (err) {
    console.error("❌ Error installing breaking_news table:", err.message);
  } finally {
    await closePool();
    process.exit(0);
  }
})();
