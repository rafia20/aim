const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getModule } = require('../modules');
const { evaluateTargets } = require('../engine/rulesEngine');
const { generateMealPlan, generateGroceryItems } = require('../ai/gemini');
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
 * /grocery-lists/generate:
 *   post:
 *     summary: Generate a priced grocery list from a meal plan
 *     security:
 *       - bearerAuth: []
 */
router.post('/grocery/generate', auth, async (req, res) => {
  const { meal_plan_id } = req.body;
  if (!meal_plan_id) return res.status(400).json({ error: 'meal_plan_id is required' });

  try {
    const mpResult = await db.query(
      `SELECT mp.*, ug.user_id, ug.goal_id, u.city, u.budget_weekly
       FROM meal_plans mp
       JOIN user_goals ug ON ug.id=mp.user_goal_id
       JOIN users u ON u.id=ug.user_id
       WHERE mp.id=$1 AND ug.user_id=$2`,
      [meal_plan_id, req.userId]
    );
    if (mpResult.rows.length === 0) return res.status(404).json({ error: 'Meal plan not found' });
    const mp = mpResult.rows[0];

    const module = getModule(mp.goal_id);
    const grocery = await generateGroceryItems({ mealPlan: mp.items, module });

    // Estimate total cost
    const totalCost = grocery.items.reduce((sum, item) => sum + (item.est_price_usd || 0), 0);

    const result = await db.query(
      `INSERT INTO grocery_lists (meal_plan_id, items, total_cost) VALUES ($1,$2,$3) RETURNING *`,
      [meal_plan_id, JSON.stringify(grocery.items), totalCost]
    );

    const overBudget = mp.budget_weekly && totalCost > mp.budget_weekly;
    res.status(201).json(addDisclaimer({
      groceryList: result.rows[0],
      totalCost,
      overBudget,
      budget: mp.budget_weekly,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
});

module.exports = router;
