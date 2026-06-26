const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getModule } = require('../modules');
const { evaluateTargets, validateSafety } = require('../engine/rulesEngine');
const { addDisclaimer } = require('../middleware/safety');

const router = express.Router();

/**
 * @swagger
 * /user-goals:
 *   post:
 *     summary: Activate a goal for the user
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
  const { goal_id, intake_answers } = req.body;
  if (!goal_id) return res.status(400).json({ error: 'goal_id is required' });

  const module = getModule(goal_id);
  if (!module) return res.status(404).json({ error: 'Goal not found' });

  const targets = evaluateTargets(module.targetRules, intake_answers || {});
  const safety = validateSafety(goal_id, intake_answers || {}, targets);
  if (!safety.safe) return res.status(400).json({ error: safety.message });

  try {
    const result = await db.query(
      `INSERT INTO user_goals (user_id, goal_id) VALUES ($1,$2) RETURNING *`,
      [req.userId, goal_id]
    );
    const userGoal = result.rows[0];

    res.status(201).json(addDisclaimer({
      userGoal,
      targets,
      message: 'Goal activated. Capture your baseline to begin tracking.',
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /user-goals:
 *   get:
 *     summary: Get user's active goals
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ug.*, g.name, g.evidence_tier, g.timeline_weeks, g.endpoint
       FROM user_goals ug JOIN goals g ON g.id = ug.goal_id
       WHERE ug.user_id=$1 ORDER BY ug.started_at DESC`,
      [req.userId]
    );
    res.json({ goals: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
