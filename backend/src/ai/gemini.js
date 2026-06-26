const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate a weekly meal plan constrained to the module's food policy and computed targets.
 * AI composes meals — it does NOT decide the numbers.
 */
async function generateMealPlan({ module, targets, intakeAnswers, budget, cookingDays, city }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a nutritionist assistant for a goal-driven nutrition app called Aim.

Goal: ${module.name}
Evidence tier: ${module.evidenceTier}

Computed targets (do NOT change these numbers):
${JSON.stringify(targets, null, 2)}

Food policy:
- Prioritize foods tagged: ${module.foodPolicy.prioritize.join(', ')}
- Limit foods tagged: ${module.foodPolicy.limit.join(', ')}
${module.foodPolicy.ramp ? `- Ramp rules: ${JSON.stringify(module.foodPolicy.ramp)}` : ''}

User context:
- Dietary preference: ${intakeAnswers.dietary_preference || 'None'}
- Allergies: ${JSON.stringify(intakeAnswers.allergies || [])}
- Weekly budget: $${budget || 'flexible'}
- Cooking days per week: ${cookingDays || 5}
- City: ${city || 'not specified'}

Generate a 7-day meal plan (breakfast, lunch, dinner, snack) that:
1. Meets the computed targets exactly
2. Respects the food policy tags
3. Fits the user's dietary preference and allergies
4. Is practical for the number of cooking days (use leftovers/batch cooking)

Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": { "name": "...", "description": "...", "protein_g": 0, "tags": [] },
        "lunch": { "name": "...", "description": "...", "protein_g": 0, "tags": [] },
        "dinner": { "name": "...", "description": "...", "protein_g": 0, "tags": [] },
        "snack": { "name": "...", "description": "...", "protein_g": 0, "tags": [] }
      },
      "daily_protein_g": 0
    }
  ],
  "weekly_summary": "..."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON safely
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned non-JSON response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate a nudge reason when a user swaps away from a goal-aligned choice.
 * One sentence, plain language, no shame or restriction language.
 */
async function generateNudgeReason({ goalName, swapFrom, swapTo, foodPolicy, targets }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a supportive nutrition assistant for the app Aim.

The user chose "${swapTo}" instead of the goal-aligned default "${swapFrom}" for the goal: ${goalName}.

Food policy prioritizes: ${foodPolicy.prioritize.join(', ')}
Computed target: ${JSON.stringify(targets)}

Write ONE plain-language sentence explaining why "${swapFrom}" was the default.
Rules:
- Name the specific lever (e.g. "this keeps you near your protein target")
- No shame, fear, guilt, or restriction language
- No fabricated health claims beyond what the food policy states
- Maximum 20 words

Return ONLY the sentence, no JSON, no quotes.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generate a grocery list from a meal plan.
 */
async function generateGroceryItems({ mealPlan, module }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Convert this meal plan into a deduplicated grocery list.

Meal plan:
${JSON.stringify(mealPlan.days?.slice(0, 3), null, 2)}

Return ONLY valid JSON:
{
  "items": [
    { "name": "...", "quantity": "...", "unit": "...", "tags": [], "est_price_usd": 0 }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned non-JSON for grocery list');
  return JSON.parse(jsonMatch[0]);
}

module.exports = { generateMealPlan, generateNudgeReason, generateGroceryItems };
