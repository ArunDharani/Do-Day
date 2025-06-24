// Main.js (ESM version with fixes)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from 'url';

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection setup
const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Optional: test connection
db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ DB Connection Failed:", err));

// Set view engine and public folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "outputs"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("aesthetics"));

// Default route: redirect to today
app.get("/", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  res.redirect(`/date?selectedDate=${today}`);
});

// Route: Show tasks for a date
app.get("/date", async (req, res) => {
  try {
    const selectedDate = req.query.selectedDate;
    const result = await db.query("SELECT * FROM dolist WHERE today = $1", [selectedDate]);
    res.render("body.ejs", {
      works: result.rows,
      listTitle: selectedDate
    });
  } catch (err) {
    console.error(err);
    res.render("error.ejs");
  }
});

// Route: Add task
app.post("/add", async (req, res) => {
  const { newItem: item, list: date } = req.body;
  try {
    await db.query("INSERT INTO dolist (title, today) VALUES ($1, $2)", [item, date]);
    res.redirect(`/date?selectedDate=${date}`);
  } catch (err) {
    console.error(err);
    res.render("error.ejs");
  }
});

// Route: Remove task
app.post("/remove", async (req, res) => {
  const { removed: id, date } = req.body;
  try {
    await db.query("DELETE FROM dolist WHERE id = $1", [id]);
    res.redirect(`/date?selectedDate=${date}`);
  } catch (err) {
    console.error(err);
    res.render("error.ejs");
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
