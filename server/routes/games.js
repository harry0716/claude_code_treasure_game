const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', (req, res) => {
  const stmt = db.prepare('INSERT INTO game_sessions (user_id) VALUES (?)');
  const result = stmt.run(req.user.id);
  res.json({ sessionId: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { finalScore, result } = req.body;
  const session = db.prepare('SELECT * FROM game_sessions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!session) return res.status(404).json({ error: '找不到遊戲記錄' });

  db.prepare('UPDATE game_sessions SET ended_at = CURRENT_TIMESTAMP, final_score = ?, result = ? WHERE id = ?')
    .run(finalScore, result, req.params.id);

  res.json({ ok: true });
});

router.post('/:id/logs', (req, res) => {
  const { boxId, hasTreasure, scoreChange, scoreAfter } = req.body;
  const session = db.prepare('SELECT * FROM game_sessions WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!session) return res.status(404).json({ error: '找不到遊戲記錄' });

  db.prepare('INSERT INTO click_logs (session_id, box_id, has_treasure, score_change, score_after) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.id, boxId, hasTreasure ? 1 : 0, scoreChange, scoreAfter);

  res.json({ ok: true });
});

router.get('/', (req, res) => {
  const sessions = db.prepare(`
    SELECT gs.id, gs.started_at, gs.ended_at, gs.final_score, gs.result,
           COUNT(cl.id) as click_count
    FROM game_sessions gs
    LEFT JOIN click_logs cl ON cl.session_id = gs.id
    WHERE gs.user_id = ?
    GROUP BY gs.id
    ORDER BY gs.started_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.json(sessions);
});

module.exports = router;
