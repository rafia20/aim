const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /intake:
 *   post:
 *     summary: Save user profile and routine info
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
  const {
    bodyweight_kg, height_cm, sex, age,
    dietary_preferences, allergies,
    city, budget_weekly, cooking_days, prep_minutes, household_size,
  } = req.body;

  try {
    // Upsert user routine
    await db.query(
      `UPDATE users SET city=$1, budget_weekly=$2, cooking_days=$3, prep_minutes=$4, household_size=$5 WHERE id=$6`,
      [city, budget_weekly, cooking_days, prep_minutes, household_size || 1, req.userId]
    );

    // Upsert user profile
    await db.query(
      `INSERT INTO user_profile (user_id, bodyweight_kg, height_cm, sex, age, dietary_preferences, allergies)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (user_id) DO UPDATE SET
         bodyweight_kg=EXCLUDED.bodyweight_kg, height_cm=EXCLUDED.height_cm,
         sex=EXCLUDED.sex, age=EXCLUDED.age,
         dietary_preferences=EXCLUDED.dietary_preferences,
         allergies=EXCLUDED.allergies`,
      [req.userId, bodyweight_kg, height_cm, sex, age,
       JSON.stringify(dietary_preferences || []),
       JSON.stringify(allergies || [])]
    );

    res.json({ message: 'Profile saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
