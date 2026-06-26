const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /baselines:
 *   post:
 *     summary: Capture day-zero baseline for a goal
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
  const { user_goal_id, metric, value, photo_url } = req.body;
  if (!user_goal_id || !metric) return res.status(400).json({ error: 'user_goal_id and metric are required' });

  try {
    const ugResult = await db.query(
      'SELECT * FROM user_goals WHERE id=$1 AND user_id=$2',
      [user_goal_id, req.userId]
    );
    if (ugResult.rows.length === 0) return res.status(403).json({ error: 'Goal not found' });

    const result = await db.query(
      `INSERT INTO baselines (user_goal_id, metric, value, photo_url) VALUES ($1,$2,$3,$4) RETURNING *`,
      [user_goal_id, metric, value, photo_url]
    );
    res.status(201).json({ baseline: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
