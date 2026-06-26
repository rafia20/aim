module.exports = {
  id: 'gut',
  name: 'Gut Health',
  evidenceTier: 'moderate',
  evidenceSources: [
    {
      claim: 'High-fermented-food diet ramped to 6 servings/day raised microbiome diversity and lowered 19 inflammatory markers over 10 weeks',
      source: 'Wastyk et al., Cell, 2021 — Stanford FeFiFo trial',
      number: '6 servings/day fermented foods over 10 weeks',
    },
    {
      claim: 'High-fiber diet did not raise microbiome diversity short-term; raised inflammatory markers in low-diversity individuals',
      source: 'Wastyk et al., Cell, 2021',
      number: 'Fermented leads; fiber ramps after',
    },
  ],
  intakeQuestions: [
    { id: 'fermented_servings', prompt: 'How many servings of fermented food do you eat per day right now?', type: 'number', unit: 'servings/day', required: true },
    { id: 'fiber_level', prompt: 'How would you describe your current fiber intake?', type: 'single_select', options: ['Low', 'Medium', 'High'], required: true },
    { id: 'bloating_frequency', prompt: 'How often do you experience bloating?', type: 'single_select', options: ['Rarely', 'Sometimes', 'Often', 'Daily'], required: true },
    { id: 'regularity', prompt: 'How is your digestive regularity?', type: 'single_select', options: ['Regular', 'Irregular', 'Very irregular'], required: true },
  ],
  targetRules: [
    {
      id: 'fermented_target',
      metric: 'fermented_servings_per_day',
      formula: '6',
      display: 'Work up to 6 servings of fermented food per day over 4 weeks.',
    },
    {
      id: 'fiber_ramp',
      metric: 'fiber_ramp_weeks',
      formula: '4',
      display: 'Gradually increase fiber over 4 weeks — do not jump to high fiber immediately.',
    },
  ],
  foodPolicy: {
    prioritize: ['fermented'],
    limit: [],
    ramp: [{ tag: 'fiber', from: 1, to: 3, weeks: 4 }],
  },
  endpoint: {
    metric: 'symptom_score',
    unit: 'score_1_5',
    captureMethod: 'scale_1_5',
    cadence: 'weekly',
  },
  timelineWeeks: 10,
  evaluationRule: {
    direction: 'increase',
    minChangeToFlagWorking: 1,
    evaluateAfterWeeks: 6,
  },
};
