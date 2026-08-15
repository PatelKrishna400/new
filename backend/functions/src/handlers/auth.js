'use strict';

/**
 * Authentication handlers
 *
 * POST /auth/custom-token
 *   Returns a Firebase custom token matching the user's Telegram ID
 *   after validating initData via verifyInitData middleware.
 */

const { _admin } = require('../../index');
const { httpError } = require('../utils/helpers');

async function createCustomToken(req, res, next) {
  try {
    const telegramId = req.tgUser?.id;
    if (!telegramId) {
      throw httpError(401, 'Unauthorized — missing Telegram ID');
    }

    const token = await _admin.auth().createCustomToken(String(telegramId));
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createCustomToken };
