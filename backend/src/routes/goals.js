const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getAllModules, getModule } = require('../modules');
const { evaluateTargets, validateSafety } = require('../engine/rulesEngine');
const { addDisclaimer } = require('../middleware/safety');

const router = express.Router();

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: List all protocol modules (goal catalog)
 *     responses:
 *       200:
 *         description: List of goals with evidence tiers
 */
router.get('/', (req, res) => {
  const modules = getAllModules().map(m => ({
    id: m.id,
    name: m.name,
    evidenceTier: m.evidenceTier,
    timelineWeeks: m.timelineWeeks,
    endpoint: m.endpoint,
    intakeQuestions: m.intakeQuestions,
    evidenceSources: m.evidenceSources,
  }));
  res.json(addDisclaimer({ goals: modules }));
});

/**
 * @swagger
 * /user-goals:
 *   post:
 *     summary: Activate a goal for the user (requires baseline captured first)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
  const { goal_id, intake_answers } = req.body;
  if (!goal_id) return res.status(400).json({ error: 'goal_id is required' });

  const module = getModule(goal_id);
  if (!module) return res.status(404).json({ error: 'Goal not found' });

  // Validate safety
  const targets = evaluateTargets(module.targetRules, intake_answers || {});
  const safety = validateSafety(goal_id, intake_answers || {}, targets);
  if (!safety.safe) return res.status(400).json({ error: safety.message });

  try {
    // Check if baseline already captured
    const existing = await db.query(
      `SELECT ug.id FROM user_goals ug
       JOIN baselines b ON b.user_goal_id = ug.id
       WHERE ug.user_id=$1 AND ug.goal_id=$2 AND ug.status='active'`,
      [req.userId, goal_id]
    );

    // Create user goal
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
    // Verify this user_goal belongs to the user
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
