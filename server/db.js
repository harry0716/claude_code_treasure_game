const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.VERCEL ? '/tmp/game.db' : path.join(__dirname, 'game.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    final_score INTEGER,
    result TEXT
  );

  CREATE TABLE IF NOT EXISTS click_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES game_sessions(id),
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    box_id INTEGER NOT NULL,
    has_treasure INTEGER NOT NULL,
    score_change INTEGER NOT NULL,
    score_after INTEGER NOT NULL
  );
`);

module.exports = db;
