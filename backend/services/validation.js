/**
 * BACKEND SERVICE: VALIDATION & ANTI-FRAUD (backend/services/validation.js)
 * Server-authoritative anti-fraud verification, click velocity checks,
 * and input normalization.
 */

// Normalization Helpers
function normalizeTelegramId(id) {
  if (!id) return '';
  return String(id).trim();
}

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
}

function normalizeEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

const MIN_COOLDOWNS = {
  mini_game_memory: 12000,  // Minimum 12 seconds between Memory Match finishes
  mini_game_catcher: 15000, // Minimum 15 seconds between Coin Catcher finishes
  ad_reward: 8000,          // Minimum 8 seconds between ad rewards
  daily_streak: 3600000,    // 1 hour cooldown between streak claims
  referral_claim: 5000
};

/**
 * Validate Reward Claim Transaction
 */
function validateRewardClaim(params, antiFraudStore, clientIp, userAgent) {
  const { uid, nonce, action, payload = {} } = params;
  const now = Date.now();

  if (!uid || !action || !nonce) {
    return { ok: false, status: 400, error: 'Missing uid, action, or nonce in claim payload' };
  }

  // 1. Replay attack check
  if (antiFraudStore.processedNonces[nonce]) {
    return {
      ok: false,
      status: 409,
      error: 'Duplicate claim transaction: nonce already processed',
      duplicate: true
    };
  }

  // 2. Cooldown check
  const userCd = antiFraudStore.userCooldowns[uid] || {};
  const lastActionTime = userCd[action] || 0;
  const requiredCd = MIN_COOLDOWNS[action] || 2000;

  if (now - lastActionTime < requiredCd) {
    return {
      ok: false,
      status: 429,
      error: `Cooldown active for action '${action}'. Please wait.`,
      retryAfterMs: requiredCd - (now - lastActionTime)
    };
  }

  // 3. Mathematical bounds verification
  let approvedCoins = 0;
  let approvedDiamonds = 0;
  let approvedKeys = 0;

  if (action === 'mini_game_memory') {
    const timeRemaining = Number(payload.timeRemaining || 0);
    const mistakes = Number(payload.mistakes || 0);

    if (timeRemaining > 55) {
      return { ok: false, status: 400, error: 'Impossible completion speed flagged by anti-fraud.' };
    }

    const baseCoins = 150;
    const timeBonus = Math.max(0, Math.min(60, timeRemaining)) * 3;
    let dia = 15;
    if (mistakes <= 2) dia = 60;
    else if (mistakes <= 5) dia = 35;

    approvedCoins = baseCoins + timeBonus;
    approvedDiamonds = dia;
    approvedKeys = 1;
  } else if (action === 'mini_game_catcher') {
    const claimedCoins = Number(payload.coinsEarned || 0);
    const claimedDiamonds = Number(payload.diamondsEarned || 0);

    approvedCoins = Math.max(0, Math.min(1500, claimedCoins));
    approvedDiamonds = Math.max(0, Math.min(50, claimedDiamonds));
  } else if (action === 'ad_reward') {
    approvedCoins = Number(payload.coins || 100);
    approvedDiamonds = Number(payload.diamonds || 10);
  } else {
    approvedCoins = Math.min(500, Number(payload.coins || 0));
    approvedDiamonds = Math.min(50, Number(payload.diamonds || 0));
  }

  // Update records
  antiFraudStore.processedNonces[nonce] = now;
  if (!antiFraudStore.userCooldowns[uid]) {
    antiFraudStore.userCooldowns[uid] = {};
  }
  antiFraudStore.userCooldowns[uid][action] = now;

  antiFraudStore.auditLog.unshift({
    uid,
    action,
    approvedCoins,
    approvedDiamonds,
    clientIp,
    userAgent: (userAgent || 'unknown').slice(0, 80),
    status: 'approved',
    timestamp: now
  });
  if (antiFraudStore.auditLog.length > 100) {
    antiFraudStore.auditLog = antiFraudStore.auditLog.slice(0, 100);
  }

  return {
    ok: true,
    status: 200,
    approvedCoins,
    approvedDiamonds,
    approvedKeys
  };
}

/**
 * Click Velocity / Tap Rate Check
 */
function checkTapVelocity(uid, tapCount, tapRatesStore) {
  const now = Date.now();
  const record = tapRatesStore[uid] || { tapCount: 0, startTime: now };

  if (now - record.startTime > 1000) {
    record.tapCount = tapCount;
    record.startTime = now;
  } else {
    record.tapCount += tapCount;
  }
  tapRatesStore[uid] = record;

  // Max realistic taps per second: 35
  if (record.tapCount > 35) {
    return { ok: false, suspicious: true, rate: record.tapCount };
  }
  return { ok: true, suspicious: false, rate: record.tapCount };
}

module.exports = {
  normalizeTelegramId,
  normalizePhone,
  normalizeEmail,
  validateRewardClaim,
  checkTapVelocity
};
