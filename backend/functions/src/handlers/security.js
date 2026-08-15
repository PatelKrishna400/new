'use strict';

/**
 * Server-side Anti-Fraud & Risk Engine
 * Adheres to Section #45 of Master Prompt Specification
 */

const { isSafeId, httpError } = require('../utils/helpers');

/**
 * Calculate user risk score based on tap rate, session history, and suspicious events
 */
function calculateRiskScore(user, payload) {
  let score = user.riskScore || 0;

  // 1. Unreasonable tap rate check (>25 taps/sec)
  if (payload.tapsPerSecond && payload.tapsPerSecond > 25) {
    score += 25;
  }

  // 2. Replay/Duplicate ad session check
  if (payload.duplicateAdAttempt) {
    score += 40;
  }

  // 3. Excessive withdrawal requests in short timeframe
  if (payload.withdrawalFrequency && payload.withdrawalFrequency > 3) {
    score += 20;
  }

  let status = 'ok';
  if (score >= 80) status = 'banned';
  else if (score >= 40) status = 'review';

  return { riskScore: score, riskStatus: status };
}

module.exports = { calculateRiskScore };
