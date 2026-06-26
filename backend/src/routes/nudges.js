const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getModule } = require('../modules');
const { evaluateTargets } = require('../engine/rulesEngine');
const { generateNudgeReason } = require('../ai/gemini');

const router = express.Router();

/**
 * @swagger
 * /nudges:
 *   post:
 *     summary: Log a food swap nudge and get a reason
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
  const { user_goal_id, swap_from, swap_to, accepted, intake_answers } = req.body;
  if (!user_goal_id || !swap_from || !swap_to) {
    return res.status(400).json({ error: 'user_goal_id, swap_from, and swap_to are required' });
  }

  try {
    const ugResult = await db.query(
      'SELECT * FROM user_goals WHERE id=$1 AND user_id=$2',
      [user_goal_id, req.userId]
    );
    if (ugResult.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });

    const module = getModule(ugResult.rows[0].goal_id);
    const targets = evaluateTargets(module.targetRules, intake_answers || {});

    // Generate plain-language reason via AI
    const reason = await generateNudgeReason({
      goalName: module.name,
      swapFrom: swap_from,
      swapTo: swap_to,
      foodPolicy: module.foodPolicy,
      targets,
    });

    const result = await db.query(
      `INSERT INTO nudges (user_id, user_goal_id, swap_from, swap_to, reason, accepted)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.userId, user_goal_id, swap_from, swap_to, reason, accepted ?? null]
    );

    res.status(201).json({ nudge: result.rows[0], reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
