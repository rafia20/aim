module.exports = {
  id: 'gym',
  name: 'Build Muscle',
  evidenceTier: 'strong',
  evidenceSources: [
    {
      claim: 'Fat-free mass gains plateau beyond ~1.62 g/kg/day protein',
      source: 'Morton et al., Br J Sports Med, 2018 — 49 studies, 1863 participants',
      number: '1.62 g/kg/day breakpoint',
    },
  ],
  intakeQuestions: [
    { id: 'bodyweight_kg', prompt: 'What is your bodyweight?', type: 'number', unit: 'kg', required: true },
    { id: 'training_days', prompt: 'How many days per week do you train?', type: 'number', unit: 'days/week', required: true },
    { id: 'dietary_preference', prompt: 'Any dietary preference?', type: 'single_select', options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-free'], required: true },
    { id: 'allergies', prompt: 'Any allergies?', type: 'multi_select', options: ['None', 'Dairy', 'Eggs', 'Nuts', 'Soy', 'Shellfish'], required: true },
  ],
  targetRules: [
    {
      id: 'protein_target',
      metric: 'protein_g_per_day',
      formula: 'bodyweight_kg * 1.6',
      display: 'Hit {value} g protein/day, spread across 3 to 5 meals.',
    },
  ],
  foodPolicy: {
    prioritize: ['high_protein'],
    limit: [],
  },
  endpoint: {
    metric: 'strength_kg',
    unit: 'kg',
    captureMethod: 'manual_number',
    cadence: 'weekly',
  },
  timelineWeeks: 12,
  evaluationRule: {
    direction: 'increase',
    minChangeToFlagWorking: 5,
    evaluateAfterWeeks: 8,
  },
};
