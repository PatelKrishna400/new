'use strict';

/**
 * Telegram Mini App initData verification
 *
 * Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Algorithm:
 *   1. Parse the initData query string into key=value pairs.
 *   2. Remove the "hash" field and sort remaining pairs alphabetically.
 *   3. Join with "\n" → data_check_string.
 *   4. secret_key = HMAC-SHA256("WebAppData", BOT_TOKEN)
 *   5. computed   = HMAC-SHA256(secret_key, data_check_string) as hex
 *   6. Compare computed === hash (constant-time).
 *   7. Check auth_date is within MAX_AGE_SECONDS.
 */

const crypto = require('crypto');

const MAX_AGE_SECONDS = 86400; // 24 hours — reject stale initData

/**
 * verifyTelegramInitData(rawInitData, botToken)
 * Returns the parsed user object if valid, throws otherwise.
 */
function verifyTelegramInitData(rawInitData, botToken) {
  if (!rawInitData || typeof rawInitData !== 'string') {
    const err = new Error('Missing initData');
    err.status = 401; err.expose = true;
    throw err;
  }

  // Parse as URLSearchParams
  const params = new URLSearchParams(rawInitData);
  const hash   = params.get('hash');
  if (!hash) {
    const err = new Error('initData missing hash');
    err.status = 401; err.expose = true;
    throw err;
  }

  // Build data_check_string (all keys except hash, sorted)
  const entries = [];
  for (const [k, v] of params.entries()) {
    if (k !== 'hash') entries.push(`${k}=${v}`);
  }
  entries.sort();
  const dataCheckString = entries.join('\n');

  // Derive secret key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Compute expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const hashBuf     = Buffer.from(hash,         'hex');
  const expectedBuf = Buffer.from(expectedHash, 'hex');

  if (
    hashBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(hashBuf, expectedBuf)
  ) {
    const err = new Error('initData signature invalid');
    err.status = 401; err.expose = true;
    throw err;
  }

  // Check freshness
  const authDate = parseInt(params.get('auth_date') || '0', 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > MAX_AGE_SECONDS) {
    const err = new Error('initData expired');
    err.status = 401; err.expose = true;
    throw err;
  }

  // Parse user JSON
  const userRaw = params.get('user');
  if (!userRaw) {
    const err = new Error('initData missing user field');
    err.status = 401; err.expose = true;
    throw err;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    const err = new Error('initData user field is not valid JSON');
    err.status = 401; err.expose = true;
    throw err;
  }

  if (!user.id) {
    const err = new Error('initData user has no id');
    err.status = 401; err.expose = true;
    throw err;
  }

  return {
    id:         String(user.id),
    firstName:  user.first_name  || '',
    username:   user.username    || null,
    photoUrl:   user.photo_url   || null,
    languageCode: user.language_code || null,
    authDate,
  };
}

/**
 * Express middleware — verifyInitData
 * Attaches req.tgUser on success. Passes 401 on failure.
 *
 * In development (NODE_ENV=development) with no BOT_TOKEN set,
 * falls back to demo mode so the emulator works without a real token.
 */
function verifyInitData(req, res, next) {
  const botToken = process.env.BOT_TOKEN;

  // ── Development / emulator fallback ──
  if (!botToken || process.env.NODE_ENV === 'development') {
    console.warn('[auth] BOT_TOKEN not set — using demo auth (dev only)');
    req.tgUser = { id: 'demo_0', firstName: 'Demo', username: 'demo_user' };
    return next();
  }

  const rawInitData = req.body?.initData;

  try {
    req.tgUser = verifyTelegramInitData(rawInitData, botToken);
    return next();
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }
}

/**
 * requireAdmin(req, res, next)
 * Secondary middleware for admin-only endpoints.
 * Must run after verifyInitData.
 */
function requireAdmin(req, res, next) {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminId) {
    return res.status(403).json({ error: 'Admin not configured' });
  }
  if (req.tgUser?.id !== String(adminId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}

module.exports = { verifyInitData, verifyTelegramInitData, requireAdmin };
