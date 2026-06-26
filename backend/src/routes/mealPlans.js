const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getModule } = require('../modules');
const { evaluateTargets } = require('../engine/rulesEngine');
const { generateMealPlan } = require('../ai/gemini');
const { addDisclaimer } = require('../middleware/safety');

const router = express.Router();

/**
 * @swagger
 * /meal-plans/generate:
 *   post:
 *     summary: Generate a weekly meal plan for a user goal
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate', auth, async (req, res) => {
  const { user_goal_id, intake_answers, week_index = 1 } = req.body;
  if (!user_goal_id) return res.status(400).json({ error: 'user_goal_id is required' });

  try {
    // Load user goal and module
    const ugResult = await db.query(
      'SELECT ug.*, u.city, u.budget_weekly, u.cooking_days FROM user_goals ug JOIN users u ON u.id=ug.user_id WHERE ug.id=$1 AND ug.user_id=$2',
      [user_goal_id, req.userId]
    );
    if (ugResult.rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
    const ug = ugResult.rows[0];

    const module = getModule(ug.goal_id);
    if (!module) return res.status(404).json({ error: 'Protocol module not found' });

    // Compute targets deterministically
    const targets = evaluateTargets(module.targetRules, intake_answers || {});

    // Generate meal plan via AI
    const plan = await generateMealPlan({
      module,
      targets,
      intakeAnswers: intake_answers || {},
      budget: ug.budget_weekly,
      cookingDays: ug.cooking_days,
      city: ug.city,
    });

    // Save to DB
    const result = await db.query(
      `INSERT INTO meal_plans (user_goal_id, week_index, items) VALUES ($1,$2,$3) RETURNING *`,
      [user_goal_id, week_index, JSON.stringify(plan)]
    );

    res.status(201).json(addDisclaimer({ mealPlan: result.rows[0], targets }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

/**
 * @swagger
 * /meal-plans/latest/{userGoalId}:
 *   get:
 *     summary: Get the latest meal plan for a user goal
 *     security:
 *       - bearerAuth: []
 */
router.get('/latest/:userGoalId', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT mp.* FROM meal_plans mp
       JOIN user_goals ug ON ug.id=mp.user_goal_id
       WHERE mp.user_goal_id=$1 AND ug.user_id=$2
       ORDER BY mp.created_at DESC LIMIT 1`,
      [req.params.userGoalId, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No meal plan found' });
    res.json({ mealPlan: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
