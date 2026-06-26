require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/intake', require('./routes/intake'));
app.use('/goals', require('./routes/goals'));
app.use('/user-goals', require('./routes/goals'));
app.use('/baselines', require('./routes/goals'));
app.use('/meal-plans', require('./routes/mealPlans'));
app.use('/grocery-lists', require('./routes/mealPlans'));
app.use('/nudges', require('./routes/nudges'));
app.use('/tracking-logs', require('./routes/tracking'));
app.use('/progress', require('./routes/tracking'));

app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Aim' }));

// Initialize DB schema on startup
async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
    await db.query(schema);

    // Seed protocol modules into DB
    const { getAllModules } = require('./modules');
    for (const m of getAllModules()) {
      await db.query(
        `INSERT INTO goals (id, name, evidence_tier, timeline_weeks, food_policy, endpoint, target_rules, evidence_sources, evaluation_rule, intake_questions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.name, m.evidenceTier, m.timelineWeeks,
         JSON.stringify(m.foodPolicy), JSON.stringify(m.endpoint),
         JSON.stringify(m.targetRules), JSON.stringify(m.evidenceSources),
         JSON.stringify(m.evaluationRule), JSON.stringify(m.intakeQuestions)]
      );
    }
    console.log('DB initialized and goals seeded.');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  await initDb();
  console.log(`Aim API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
