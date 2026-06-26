module.exports = {
  id: 'energy',
  name: 'Energy & Focus',
  evidenceTier: 'emerging',
  evidenceSources: [
    {
      claim: 'Post-meal glucose response varies highly across individuals for the same foods',
      source: 'Zeevi et al., Cell, 2015 — 800-person cohort, 46,898 meals',
      number: 'Same food = highly variable glucose response across people',
    },
    {
      claim: 'Roughly half of glycemic response is non-genetic and modifiable; meal context matters',
      source: 'Berry et al., Nature Medicine, 2020 — PREDICT study',
      number: '~50% of glucose response is modifiable',
    },
  ],
  intakeQuestions: [
    { id: 'crash_times', prompt: 'When do you typically feel energy crashes?', type: 'multi_select', options: ['Mid-morning', 'After lunch', 'Mid-afternoon', 'Evening'], required: true },
    { id: 'meal_timing', prompt: 'How regular is your meal timing?', type: 'single_select', options: ['Very regular', 'Somewhat regular', 'Irregular'], required: true },
    { id: 'caffeine_cups', prompt: 'How many caffeinated drinks per day?', type: 'number', unit: 'cups/day', required: true },
  ],
  targetRules: [
    {
      id: 'glycemic_smoothing',
      metric: 'meal_glycemic_load',
      formula: '40',
      display: 'Keep each main meal under 40 glycemic load units for steadier energy.',
    },
  ],
  foodPolicy: {
    prioritize: ['high_protein', 'high_fiber'],
    limit: ['high_glycemic_load'],
  },
  endpoint: {
    metric: 'energy_score',
    unit: 'score_1_5',
    captureMethod: 'scale_1_5',
    cadence: 'daily',
  },
  timelineWeeks: 6,
  evaluationRule: {
    direction: 'increase',
    minChangeToFlagWorking: 1,
    evaluateAfterWeeks: 2,
  },
};
