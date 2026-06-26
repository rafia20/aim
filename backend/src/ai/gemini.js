const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-flash-latest';

// Fallback meal templates per goal when AI is unavailable
const FALLBACK_MEALS = {
  gym: {
    meals: [
      { breakfast: { name: 'Greek Yogurt & Granola Bowl', description: 'High-protein yogurt with oats, berries, and honey', protein_g: 30, tags: ['high_protein'] },
        lunch: { name: 'Grilled Chicken & Rice', description: 'Chicken breast with brown rice and steamed broccoli', protein_g: 45, tags: ['high_protein'] },
        dinner: { name: 'Salmon with Sweet Potato', description: 'Baked salmon fillet with roasted sweet potato and greens', protein_g: 40, tags: ['high_protein'] },
        snack: { name: 'Protein Shake & Banana', description: 'Whey protein shake with a banana', protein_g: 25, tags: ['high_protein'] } },
      { breakfast: { name: 'Egg & Avocado Toast', description: '3 scrambled eggs on whole grain toast with avocado', protein_g: 25, tags: ['high_protein'] },
        lunch: { name: 'Turkey & Quinoa Bowl', description: 'Ground turkey with quinoa, black beans, and salsa', protein_g: 42, tags: ['high_protein'] },
        dinner: { name: 'Beef Stir-fry', description: 'Lean beef strips with mixed vegetables and rice noodles', protein_g: 38, tags: ['high_protein'] },
        snack: { name: 'Cottage Cheese & Almonds', description: 'Cottage cheese with mixed nuts', protein_g: 20, tags: ['high_protein'] } },
    ],
  },
  gut: {
    meals: [
      { breakfast: { name: 'Kefir Smoothie Bowl', description: 'Kefir blended with banana and topped with fermented granola', protein_g: 15, tags: ['fermented'] },
        lunch: { name: 'Kimchi Rice Bowl', description: 'Brown rice with kimchi, soft-boiled egg, and sesame vegetables', protein_g: 20, tags: ['fermented'] },
        dinner: { name: 'Miso Glazed Chicken', description: 'Chicken with miso glaze, steamed rice, and pickled vegetables', protein_g: 30, tags: ['fermented'] },
        snack: { name: 'Yogurt with Kombucha', description: 'Plain yogurt with a small kombucha drink', protein_g: 10, tags: ['fermented'] } },
      { breakfast: { name: 'Yogurt Parfait', description: 'Natural yogurt with honey, walnuts, and mixed berries', protein_g: 18, tags: ['fermented'] },
        lunch: { name: 'Sauerkraut & Chicken Wrap', description: 'Whole wheat wrap with chicken, sauerkraut, and mustard', protein_g: 25, tags: ['fermented'] },
        dinner: { name: 'Tempeh Stir-fry', description: 'Marinated tempeh with vegetables and brown rice', protein_g: 28, tags: ['fermented'] },
        snack: { name: 'Fermented Vegetable Sticks', description: 'Pickled carrots, radish, and cucumber', protein_g: 3, tags: ['fermented'] } },
    ],
  },
  skin: {
    meals: [
      { breakfast: { name: 'Oatmeal with Berries', description: 'Steel-cut oats with blueberries and chia seeds', protein_g: 12, tags: ['low_glycemic_load'] },
        lunch: { name: 'Lentil & Vegetable Soup', description: 'Red lentil soup with spinach and whole grain bread', protein_g: 18, tags: ['low_glycemic_load'] },
        dinner: { name: 'Grilled Fish & Vegetables', description: 'White fish with roasted zucchini and quinoa', protein_g: 32, tags: ['low_glycemic_load'] },
        snack: { name: 'Apple & Almond Butter', description: 'Sliced apple with natural almond butter', protein_g: 6, tags: ['low_glycemic_load'] } },
    ],
  },
  fat_loss: {
    meals: [
      { breakfast: { name: 'Veggie Egg White Omelette', description: 'Egg whites with spinach, tomato, and feta', protein_g: 28, tags: ['high_protein', 'high_satiety'] },
        lunch: { name: 'Chicken Salad Bowl', description: 'Grilled chicken on mixed greens with chickpeas and lemon dressing', protein_g: 40, tags: ['high_protein', 'high_satiety'] },
        dinner: { name: 'Turkey Meatballs & Zoodles', description: 'Lean turkey meatballs with zucchini noodles and marinara', protein_g: 35, tags: ['high_protein', 'high_satiety'] },
        snack: { name: 'Greek Yogurt', description: 'Plain Greek yogurt with cinnamon', protein_g: 20, tags: ['high_protein', 'high_satiety'] } },
    ],
  },
  energy: {
    meals: [
      { breakfast: { name: 'Overnight Oats', description: 'Oats soaked in milk with chia seeds, nuts, and banana', protein_g: 15, tags: ['high_fiber'] },
        lunch: { name: 'Chicken & Sweet Potato Bowl', description: 'Grilled chicken with sweet potato and leafy greens', protein_g: 30, tags: ['high_protein'] },
        dinner: { name: 'Salmon & Brown Rice', description: 'Baked salmon with brown rice and steamed broccoli', protein_g: 35, tags: ['high_protein', 'high_fiber'] },
        snack: { name: 'Trail Mix & Apple', description: 'Mixed nuts and dried fruit with a small apple', protein_g: 8, tags: ['high_fiber'] } },
    ],
  },
};

function buildFallbackPlan(goalId) {
  const templates = FALLBACK_MEALS[goalId] || FALLBACK_MEALS.gym;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const template = templates.meals[i % templates.meals.length];
    const dailyProtein = Object.values(template).reduce((sum, m) => sum + (m.protein_g || 0), 0);
    days.push({ day: i + 1, meals: { ...template }, daily_protein_g: dailyProtein });
  }
  return {
    days,
    weekly_summary: 'Template-based plan. AI-personalised plans will be available when API quota resets.',
  };
}

/**
 * Generate a weekly meal plan. Falls back to templates if AI is unavailable.
 */
async function generateMealPlan({ module, targets, intakeAnswers, budget, cookingDays, city }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned non-JSON response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.log('AI unavailable, using fallback meal plan:', err.message.substring(0, 100));
    return buildFallbackPlan(module.id);
  }
}

/**
 * Generate a nudge reason. Falls back to a template reason.
 */
async function generateNudgeReason({ goalName, swapFrom, swapTo, foodPolicy, targets }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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
  } catch {
    return `"${swapFrom}" was chosen because it aligns with your ${foodPolicy.prioritize[0] || 'goal'} target.`;
  }
}

/**
 * Generate a grocery list. Falls back to extracting items from meals.
 */
async function generateGroceryItems({ mealPlan, module }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Convert this meal plan into a deduplicated grocery list.

Meal plan:
${JSON.stringify(mealPlan.days?.slice(0, 3) || mealPlan, null, 2)}

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
  } catch {
    // Build a basic grocery list from meal names
    const items = [
      { name: 'Chicken breast', quantity: '1', unit: 'kg', tags: ['high_protein'], est_price_usd: 8 },
      { name: 'Brown rice', quantity: '1', unit: 'kg', tags: [], est_price_usd: 3 },
      { name: 'Eggs (dozen)', quantity: '1', unit: 'pack', tags: ['high_protein'], est_price_usd: 4 },
      { name: 'Greek yogurt', quantity: '500', unit: 'g', tags: ['fermented', 'high_protein'], est_price_usd: 5 },
      { name: 'Mixed vegetables', quantity: '1', unit: 'kg', tags: ['high_fiber'], est_price_usd: 4 },
      { name: 'Bananas', quantity: '6', unit: 'pcs', tags: [], est_price_usd: 2 },
      { name: 'Olive oil', quantity: '500', unit: 'ml', tags: [], est_price_usd: 6 },
      { name: 'Whole grain bread', quantity: '1', unit: 'loaf', tags: [], est_price_usd: 3 },
    ];
    return { items };
  }
}

module.exports = { generateMealPlan, generateNudgeReason, generateGroceryItems };
