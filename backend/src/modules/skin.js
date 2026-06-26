module.exports = {
  id: 'skin',
  name: 'Clear Skin',
  evidenceTier: 'mixed',
  evidenceSources: [
    {
      claim: 'Low-glycemic-load diet cut lesion counts by 23.5 vs 12 in controls over 12 weeks',
      source: 'Smith et al., Am J Clin Nutr, 2007',
      number: '23.5 vs 12 lesion count reduction',
    },
    {
      claim: '2025 meta-analysis found no significant pooled association between diet and acne',
      source: 'JAAD systematic review, 2022; 2025 meta-analysis',
      number: 'Evidence is mixed — dairy effects are population-dependent',
    },
  ],
  intakeQuestions: [
    { id: 'skin_photo_baseline', prompt: 'Take a well-lit selfie for your baseline (front-facing, natural light).', type: 'boolean', required: true },
    { id: 'high_gi_foods', prompt: 'How often do you eat high-glycemic foods (white bread, sugary drinks, sweets)?', type: 'single_select', options: ['Rarely', 'Sometimes', 'Daily', 'Multiple times/day'], required: true },
    { id: 'dairy_intake', prompt: 'How much dairy do you consume?', type: 'single_select', options: ['None', 'Low', 'Moderate', 'High'], required: true },
  ],
  targetRules: [
    {
      id: 'glycemic_load_cap',
      metric: 'daily_glycemic_load',
      formula: '80',
      display: 'Keep your daily glycemic load under 80 units.',
    },
  ],
  foodPolicy: {
    prioritize: ['low_glycemic_load'],
    limit: ['high_glycemic_load'],
  },
  endpoint: {
    metric: 'lesion_count',
    unit: 'count',
    captureMethod: 'photo',
    cadence: 'weekly',
  },
  timelineWeeks: 12,
  evaluationRule: {
    direction: 'decrease',
    minChangeToFlagWorking: 3,
    evaluateAfterWeeks: 8,
  },
};
