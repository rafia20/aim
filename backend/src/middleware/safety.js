/**
 * Safety guardrails — P0, applied across every goal.
 * No restriction/shame mechanics. No unsafe deficits. Not medical advice.
 */
const UNSAFE_PATTERNS = [
  /starv/i, /fast for \d+ days/i, /extreme diet/i,
];

function safetyGuard(req, res, next) {
  // Check for unsafe input patterns
  const body = JSON.stringify(req.body || '');
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(body)) {
      return res.status(400).json({
        error: 'This request contains content that may be unsafe.',
        advice: 'Please consult a qualified healthcare professional for medical or extreme dietary guidance.',
      });
    }
  }
  next();
}

const MEDICAL_DISCLAIMER = 'This app provides general nutrition guidance only and is not medical advice. Consult a qualified healthcare professional before making significant dietary changes.';

function addDisclaimer(data) {
  return { ...data, disclaimer: MEDICAL_DISCLAIMER };
}

module.exports = { safetyGuard, addDisclaimer, MEDICAL_DISCLAIMER };
