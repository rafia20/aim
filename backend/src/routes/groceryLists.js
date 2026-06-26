const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { getModule } = require('../modules');
const { generateGroceryItems } = require('../ai/gemini');
const { addDisclaimer } = require('../middleware/safety');

const router = express.Router();

/**
 * @swagger
 * /grocery-lists/generate:
 *   post:
 *     summary: Generate a priced grocery list from a meal plan
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate', auth, async (req, res) => {
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
    console.error('Grocery error:', err.message);
    res.status(500).json({ error: 'Failed to generate grocery list: ' + err.message });
  }
});

module.exports = router;
