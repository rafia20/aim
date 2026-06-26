const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getModule } = require('../modules');
const { evaluateProgress } = require('../engine/rulesEngine');
const { addDisclaimer } = require('../middleware/safety');

const router = express.Router();

/**
 * @swagger
 * /tracking-logs:
 *   post:
 *     summary: Log an endpoint value for a user goal
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
  const { user_goal_id, metric, value, notes } = req.body;
  if (!user_goal_id || !metric || value === undefined) {
    return res.status(400).json({ error: 'user_goal_id, metric, and value are required' });
  }

  try {
    const ugResult = await db.query(
      'SELECT * FROM user_goals WHERE id=$1 AND user_id=$2',
      [user_goal_id, req.userId]
    );
    if (ugResult.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });

    const result = await db.query(
      `INSERT INTO tracking_logs (user_goal_id, metric, value, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [user_goal_id, metric, value, notes]
    );

    res.status(201).json({
      log: result.rows[0],
      message: "Logged. Keep going — consistency over perfection. Missing a day doesn't derail your progress.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /progress/{userGoalId}:
 *   get:
 *     summary: Get trend vs baseline and is_working verdict
 *     security:
 *       - bearerAuth: []
 */
router.get('/:userGoalId', auth, async (req, res) => {
  const { userGoalId } = req.params;

  try {
    const ugResult = await db.query(
      'SELECT ug.*, g.timeline_weeks FROM user_goals ug JOIN goals g ON g.id=ug.goal_id WHERE ug.id=$1 AND ug.user_id=$2',
      [userGoalId, req.userId]
    );
    if (ugResult.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    const ug = ugResult.rows[0];

    const module = getModule(ug.goal_id);

    // Get baseline
    const baselineResult = await db.query(
      'SELECT * FROM baselines WHERE user_goal_id=$1 ORDER BY captured_at ASC LIMIT 1',
      [userGoalId]
    );
    if (baselineResult.rows.length === 0) {
      return res.status(400).json({ error: 'No baseline captured yet' });
    }
    const baseline = baselineResult.rows[0];

    // Get all tracking logs
    const logsResult = await db.query(
      'SELECT * FROM tracking_logs WHERE user_goal_id=$1 ORDER BY logged_at ASC',
      [userGoalId]
    );
    const logs = logsResult.rows;

    // Current value = most recent log
    const currentValue = logs.length > 0 ? logs[logs.length - 1].value : baseline.value;

    // Evaluate progress
    const { delta, isWorking } = evaluateProgress(
      parseFloat(baseline.value),
      parseFloat(currentValue),
      module.evaluationRule
    );

    // Weeks elapsed
    const weeksElapsed = Math.floor(
      (Date.now() - new Date(ug.started_at).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    const canEvaluate = weeksElapsed >= module.evaluationRule.evaluateAfterWeeks;

    res.json(addDisclaimer({
      baseline: baseline.value,
      current: currentValue,
      delta,
      isWorking: canEvaluate ? isWorking : null,
      canEvaluate,
      weeksElapsed,
      timelineWeeks: module.timelineWeeks,
      evaluateAfterWeeks: module.evaluationRule.evaluateAfterWeeks,
      logs: logs.map(l => ({ value: l.value, loggedAt: l.logged_at })),
      message: canEvaluate
        ? (isWorking ? "Your endpoint is moving in the right direction." : "Not enough change yet — stay consistent.")
        : `Check back at week ${module.evaluationRule.evaluateAfterWeeks} for your first verdict. You're on the biological timeline.`,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
