module.exports = {
  id: 'fat_loss',
  name: 'Fat Loss',
  evidenceTier: 'strong',
  evidenceSources: [
    {
      claim: 'Maintaining protein at or above 1.6 g/kg/day during a deficit protects lean mass',
      source: 'Morton et al., Br J Sports Med, 2018',
      number: '1.6 g/kg/day minimum protein during fat loss',
    },
  ],
  intakeQuestions: [
    { id: 'bodyweight_kg', prompt: 'What is your current bodyweight?', type: 'number', unit: 'kg', required: true },
    { id: 'goal_weight_kg', prompt: 'What is your goal weight?', type: 'number', unit: 'kg', required: true },
    { id: 'activity_level', prompt: 'How active are you?', type: 'single_select', options: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'], required: true },
    { id: 'dietary_preference', prompt: 'Any dietary preference?', type: 'single_select', options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-free'], required: true },
  ],
  targetRules: [
    {
      id: 'protein_target',
      metric: 'protein_g_per_day',
      formula: 'bodyweight_kg * 1.6',
      display: 'Keep protein at {value} g/day to protect muscle while losing fat.',
    },
    {
      id: 'max_weekly_loss',
      metric: 'max_weekly_loss_kg',
      formula: '0.75',
      display: 'Aim for no more than 0.75 kg loss per week — faster is not safer.',
    },
  ],
  foodPolicy: {
    prioritize: ['high_protein', 'high_satiety'],
    limit: ['high_calorie_low_satiety'],
  },
  endpoint: {
    metric: 'bodyweight_kg',
    unit: 'kg',
    captureMethod: 'weight',
    cadence: 'weekly',
  },
  timelineWeeks: 12,
  evaluationRule: {
    direction: 'decrease',
    minChangeToFlagWorking: 1,
    evaluateAfterWeeks: 4,
  },
};
