/**
 * BACKEND ENTRYPOINT & API ROUTER (backend/index.js)
 * High-performance native Node.js HTTP server:
 * - REST API endpoints (/api/health, /api/rewards, /api/requests, /api/users, /api/tasks, /api/auth, /api/reward/claim)
 * - Anti-fraud, click velocity checks & server-authoritative auditing
 * - High-speed static file streaming with Gzip compression and ETag 304 caching
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const {
  normalizeTelegramId,
  normalizePhone,
  normalizeEmail,
  validateRewardClaim,
  checkTapVelocity
} = require('./services/validation');
const { initFirebaseAdmin } = require('./services/firebase-admin');

// Initialize optional Firebase Admin
initFirebaseAdmin();

const staticCache = new Map();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const ADMIN_DIR = path.join(ROOT_DIR, 'admin');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Authoritative In-Memory Fallback State
const memoryStore = {
  rewards: [],
  requests: [],
  accountRequests: [],
  users: {},
  usersByProfileCode: {},
  websiteTasks: [],
  telegramTasks: [],
  gameConfig: {
    appName: 'Energy Tap',
    maintenanceMode: false,
    announcementText: '',
    announcementActive: false
  },
  levelsConfig: {},
  notifications: [
    {
      id: 'notif_1',
      type: 'reward',
      title: '🎁 Daily Reward Available',
      message: 'Your Daily Streak bonus is ready to collect! Tap to claim today’s coins and free scratch cards.',
      timestamp: Date.now() - 3600000,
      read: false,
      actionText: 'Claim Streak',
      actionTarget: 'streak'
    },
    {
      id: 'notif_2',
      type: 'system',
      title: '🏆 Achievement Unlocked',
      message: 'Congratulations! You unlocked the Tap Master badge. Visit Profile to inspect your rewards.',
      timestamp: Date.now() - 7200000,
      read: false,
      actionText: 'View Badges',
      actionTarget: 'profile'
    },
    {
      id: 'notif_3',
      type: 'reward',
      title: '🔥 Your 7-Day Streak is Active',
      message: 'Incredible momentum! Keep tapping daily to maintain your peak combo multiplier and win mega diamonds.',
      timestamp: Date.now() - 86400000,
      read: false,
      actionText: 'Check Streak',
      actionTarget: 'streak'
    }
  ],
  antiFraud: {
    processedNonces: {},
    userCooldowns: {},
    auditLog: [],
    tapRates: {}
  },
  identityIndex: {
    telegram: {},
    phone: {},
    email: {}
  },
  authConfig: {
    telegramLogin: true,
    phoneAuth: true,
    emailAuth: true,
    oneTelegramOneAccount: true,
    onePhoneOneAccount: true,
    oneEmailOneAccount: true,
    accountLinking: true,
    updatedAt: Date.now()
  }
};

function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ==========================================================================
  // BACKEND REST API ENDPOINTS (/api/...)
  // ==========================================================================
  if (pathname.startsWith('/api/')) {
    const apiRoute = pathname.replace(/^\/api/, '');

    // 1. Health Check
    if (apiRoute === '/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'Energy Tap Backend API',
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    }

    // 2. Mega Rewards Catalog API
    if (apiRoute === '/rewards' || apiRoute.startsWith('/rewards/')) {
      if (req.method === 'GET') {
        return sendJson(res, 200, { ok: true, rewards: memoryStore.rewards });
      }

      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (!body.title) {
          return sendJson(res, 400, { ok: false, error: 'Title is required' });
        }
        const newReward = {
          id: body.id || 'reward_' + Date.now(),
          title: body.title,
          category: body.category || 'gift-card',
          diamonds: Number(body.diamonds || body.diamondCost || 100),
          realValue: body.realValue || '',
          offerValue: body.offerValue || '',
          stock: Number(body.stock || 10),
          buyerStar: Number(body.buyerStar || 4.9),
          link: body.link || '',
          imageUrl: body.imageUrl || '',
          tag: body.tag || 'FEATURED',
          status: 'active',
          updatedAt: Date.now()
        };
        memoryStore.rewards.push(newReward);
        return sendJson(res, 201, { ok: true, reward: newReward });
      }

      if (req.method === 'PUT') {
        const id = apiRoute.replace('/rewards/', '');
        const body = await parseRequestBody(req);
        const idx = memoryStore.rewards.findIndex(r => r.id === id);
        if (idx !== -1) {
          memoryStore.rewards[idx] = { ...memoryStore.rewards[idx], ...body, updatedAt: Date.now() };
          return sendJson(res, 200, { ok: true, reward: memoryStore.rewards[idx] });
        }
        return sendJson(res, 404, { ok: false, error: 'Reward not found' });
      }

      if (req.method === 'DELETE') {
        const id = apiRoute.replace('/rewards/', '');
        memoryStore.rewards = memoryStore.rewards.filter(r => r.id !== id);
        return sendJson(res, 200, { ok: true });
      }
    }

    // 3. Redemption Requests API
    if (apiRoute === '/requests' || apiRoute.startsWith('/requests/')) {
      if (req.method === 'GET') {
        return sendJson(res, 200, { ok: true, requests: memoryStore.requests });
      }

      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        const newReq = {
          id: body.id || 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          userId: body.userId || 'anonymous',
          username: body.username || 'Player',
          telegramHandle: body.telegramHandle || '',
          rewardTitle: body.rewardTitle || body.itemTitle || 'Mega Reward',
          rewardId: body.rewardId || '',
          itemCategory: body.itemCategory || '',
          diamondCost: Number(body.diamondCost || 0),
          shippingDetails: body.shippingDetails || body.deliveryInfo || '',
          notes: body.notes || '',
          contactInfo: body.contactInfo || '',
          webTasksCompleted: Number(body.webTasksCompleted || 0),
          status: 'pending',
          createdAt: Date.now()
        };
        memoryStore.requests.unshift(newReq);
        return sendJson(res, 201, { ok: true, request: newReq });
      }

      if (req.method === 'PUT') {
        const id = apiRoute.replace('/requests/', '');
        const body = await parseRequestBody(req);
        const reqItem = memoryStore.requests.find(r => r.id === id);
        if (reqItem) {
          reqItem.status = body.status || 'approved';
          reqItem.updatedAt = Date.now();
          return sendJson(res, 200, { ok: true, request: reqItem });
        }
        return sendJson(res, 404, { ok: false, error: 'Request not found' });
      }
    }

    // 4. Users / Player Sync API (Prevents Duplicate User Creation)
    if (apiRoute === '/users' || apiRoute.startsWith('/users/')) {
      if (req.method === 'GET') {
        return sendJson(res, 200, { ok: true, users: Object.values(memoryStore.users) });
      }

      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        const uid = body.uid;
        if (!uid) {
          return sendJson(res, 400, { ok: false, error: 'UID is required' });
        }

        const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '');
        const profileCode = body.profileCode || ('ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : uid.toUpperCase()));

        const existingUid = memoryStore.usersByProfileCode[profileCode];
        if (existingUid && existingUid !== uid) {
          return sendJson(res, 409, { ok: false, error: 'Profile Code already registered to another account' });
        }

        const updatedUser = {
          ...(memoryStore.users[uid] || {}),
          ...body,
          uid,
          profileCode,
          updatedAt: Date.now()
        };
        memoryStore.users[uid] = updatedUser;
        memoryStore.usersByProfileCode[profileCode] = uid;
        return sendJson(res, 200, { ok: true, user: updatedUser });
      }
    }

    // 5. Tasks Management API (/api/tasks)
    if (apiRoute === '/tasks' || apiRoute.startsWith('/tasks/')) {
      if (apiRoute === '/tasks' && req.method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          websiteTasks: memoryStore.websiteTasks,
          telegramTasks: memoryStore.telegramTasks
        });
      }

      if (apiRoute === '/tasks/website' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (Array.isArray(body)) {
          memoryStore.websiteTasks = body;
          return sendJson(res, 200, { ok: true, websiteTasks: memoryStore.websiteTasks });
        }
        const newTask = {
          id: body.id || 'web_' + Date.now().toString(36),
          title: body.title || 'Website Quest',
          url: body.url || '',
          code: body.code || '1234',
          costCoins: Number(body.costCoins || 1000),
          diamondReward: Number(body.diamondReward || 100),
          tagText: body.tagText || body.tag || 'SPONSOR QUEST',
          btnText: body.btnText || 'Unlock & Visit',
          updatedAt: Date.now()
        };
        const idx = memoryStore.websiteTasks.findIndex(t => t.id === newTask.id);
        if (idx !== -1) {
          memoryStore.websiteTasks[idx] = { ...memoryStore.websiteTasks[idx], ...newTask };
        } else {
          memoryStore.websiteTasks.push(newTask);
        }
        return sendJson(res, 201, { ok: true, task: newTask });
      }

      if (apiRoute === '/tasks/telegram' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (Array.isArray(body)) {
          memoryStore.telegramTasks = body;
          return sendJson(res, 200, { ok: true, telegramTasks: memoryStore.telegramTasks });
        }
        const newTask = {
          id: body.id || 'tg_' + Date.now().toString(36),
          title: body.title || 'Telegram Channel',
          url: body.url || '',
          rewardCards: Number(body.rewardCards || body.scratchCards || 1),
          scratchCards: Number(body.rewardCards || body.scratchCards || 1),
          rewardText: body.rewardText || `${Number(body.rewardCards || 1)} Scratch Card 🎴`,
          btnText: body.btnText || 'Join',
          tagText: body.tagText || 'TELEGRAM CHANNEL',
          updatedAt: Date.now()
        };
        const idx = memoryStore.telegramTasks.findIndex(t => t.id === newTask.id);
        if (idx !== -1) {
          memoryStore.telegramTasks[idx] = { ...memoryStore.telegramTasks[idx], ...newTask };
        } else {
          memoryStore.telegramTasks.push(newTask);
        }
        return sendJson(res, 201, { ok: true, task: newTask });
      }

      if (apiRoute.startsWith('/tasks/website/') && req.method === 'DELETE') {
        const id = apiRoute.replace('/tasks/website/', '');
        memoryStore.websiteTasks = memoryStore.websiteTasks.filter(t => t.id !== id);
        return sendJson(res, 200, { ok: true });
      }

      if (apiRoute.startsWith('/tasks/telegram/') && req.method === 'DELETE') {
        const id = apiRoute.replace('/tasks/telegram/', '');
        memoryStore.telegramTasks = memoryStore.telegramTasks.filter(t => t.id !== id);
        return sendJson(res, 200, { ok: true });
      }
    }

    // 6. Anti-Fraud & Reward Claims (/api/reward/claim)
    if (apiRoute === '/reward/claim' && req.method === 'POST') {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const body = await parseRequestBody(req);

      const claimResult = validateRewardClaim(body, memoryStore.antiFraud, clientIp, userAgent);
      if (!claimResult.ok) {
        return sendJson(res, claimResult.status, claimResult);
      }

      const uid = body.uid;
      if (!memoryStore.users[uid]) {
        memoryStore.users[uid] = {
          uid,
          player: { coins: 0, diamonds: 0, name: 'Player' },
          bank: { coins: 0, diamonds: 0, keys: 0 },
          updatedAt: Date.now()
        };
      }
      const userObj = memoryStore.users[uid];
      if (!userObj.player) userObj.player = { coins: 0, diamonds: 0 };
      if (!userObj.bank) userObj.bank = { coins: 0, diamonds: 0, keys: 0 };

      userObj.player.coins = (userObj.player.coins || 0) + claimResult.approvedCoins;
      userObj.player.diamonds = (userObj.player.diamonds || 0) + claimResult.approvedDiamonds;
      userObj.bank.diamonds = (userObj.bank.diamonds || 0) + claimResult.approvedDiamonds;
      userObj.bank.keys = (userObj.bank.keys || 0) + claimResult.approvedKeys;
      userObj.updatedAt = Date.now();

      return sendJson(res, 200, {
        ok: true,
        success: true,
        action: body.action,
        approvedRewards: {
          coins: claimResult.approvedCoins,
          diamonds: claimResult.approvedDiamonds,
          keys: claimResult.approvedKeys
        },
        balances: {
          coins: userObj.player.coins,
          diamonds: userObj.bank.diamonds,
          keys: userObj.bank.keys
        }
      });
    }

    // 7. Tap Session Verification
    if (apiRoute === '/anti-fraud/verify-tap-session' && req.method === 'POST') {
      const body = await parseRequestBody(req);
      const { uid, tapCount, durationSeconds } = body;
      const validDuration = Math.max(1, Number(durationSeconds) || 1);
      const rate = Number(tapCount || 0) / validDuration;

      const isCritical = rate > 40;
      const isSuspicious = rate > 25;

      if (isCritical) {
        memoryStore.antiFraud.auditLog.unshift({
          uid: uid || 'anonymous',
          action: 'tap_frequency_anomaly',
          rate: Number(rate.toFixed(1)),
          status: 'blocked',
          timestamp: Date.now()
        });
        return sendJson(res, 400, {
          ok: false,
          verified: false,
          valid: false,
          riskLevel: 'CRITICAL',
          ratePerSec: Number(rate.toFixed(1)),
          error: 'Impossible tap frequency detected: autoclicker / bot pattern blocked.'
        });
      }

      return sendJson(res, 200, {
        ok: true,
        verified: !isSuspicious,
        valid: !isSuspicious,
        riskLevel: isSuspicious ? 'HIGH' : 'NORMAL',
        ratePerSec: Number(rate.toFixed(1)),
        warning: isSuspicious ? 'Excessive tap frequency detected: potential autoclicker script' : null
      });
    }

    // 8. Authentication & Identity Management
    if (apiRoute.startsWith('/auth')) {
      if (apiRoute === '/auth/telegram' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const uPayload = body.user || {};
        const rawTgId = body.telegramId || body.id || uPayload.id || uPayload.telegramId;
        const tgId = normalizeTelegramId(rawTgId);

        if (!tgId) {
          return sendJson(res, 400, { ok: false, error: 'Telegram User ID is required' });
        }

        const username = body.username || uPayload.username || '';
        const firstName = body.firstName || uPayload.first_name || '';
        const lastName = body.lastName || uPayload.last_name || '';

        const existingUid = memoryStore.identityIndex.telegram[tgId];
        if (existingUid) {
          const existingUser = memoryStore.users[existingUid] || { uid: existingUid };
          existingUser.lastLogin = Date.now();
          if (username) existingUser.telegramHandle = '@' + username.replace(/^@/, '');
          if (firstName) existingUser.firstName = firstName;
          memoryStore.users[existingUid] = existingUser;

          return sendJson(res, 200, {
            ok: true,
            isNew: false,
            isExisting: true,
            uid: existingUid,
            telegramId: tgId,
            user: existingUser,
            message: 'Existing Telegram account verified. Logging into existing account.'
          });
        }

        const newUid = body.uid || ('tg_' + tgId);
        const cleanUid = newUid.replace(/[^a-zA-Z0-9]/g, '');
        const profileCode = body.profileCode || ('ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : cleanUid.toUpperCase()));

        const newUser = {
          uid: newUid,
          telegramId: tgId,
          username: username ? ('@' + username.replace(/^@/, '')) : ('user_' + tgId.substring(0, 6)),
          firstName: firstName || 'Player',
          lastName: lastName || '',
          telegramHandle: username ? ('@' + username.replace(/^@/, '')) : '',
          profileCode,
          level: 0,
          xp: 0,
          coins: 1000,
          diamonds: 50,
          status: 'active',
          createdAt: Date.now(),
          lastLogin: Date.now()
        };

        memoryStore.users[newUid] = newUser;
        memoryStore.identityIndex.telegram[tgId] = newUid;

        return sendJson(res, 200, {
          ok: true,
          isNew: true,
          isExisting: false,
          uid: newUid,
          telegramId: tgId,
          user: newUser,
          message: 'Account created with permanent Telegram identity.'
        });
      }
    }

    return sendJson(res, 404, { ok: false, error: 'API route not found' });
  }

  // ==========================================================================
  // STATIC FILE STREAMING: ADMIN PORTAL (/admin) vs FRONTEND (/)
  // ==========================================================================
  let targetFile;

  if (pathname === '/admin' || pathname === '/admin/') {
    targetFile = path.join(ADMIN_DIR, 'index.html');
  } else if (pathname.startsWith('/admin/')) {
    const relPath = pathname.replace(/^\/admin\//, '');
    targetFile = path.join(ADMIN_DIR, relPath);
  } else {
    const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    targetFile = path.join(FRONTEND_DIR, relPath);
    if (!fs.existsSync(targetFile)) {
      const rootFallback = path.join(ROOT_DIR, relPath);
      if (fs.existsSync(rootFallback) && !fs.statSync(rootFallback).isDirectory()) {
        targetFile = rootFallback;
      }
    }
  }

  fs.stat(targetFile, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isText = ['.html', '.css', '.js', '.json', '.svg'].includes(ext);

    let cached = staticCache.get(targetFile);
    if (!cached || cached.mtimeMs !== stats.mtimeMs || cached.size !== stats.size) {
      try {
        const content = fs.readFileSync(targetFile);
        const etag = `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
        let gzipBuffer = null;
        if (isText && content.length > 256) {
          gzipBuffer = zlib.gzipSync(content, { level: 6 });
        }
        cached = {
          mtimeMs: stats.mtimeMs,
          size: stats.size,
          rawBuffer: content,
          gzipBuffer: gzipBuffer,
          etag: etag,
          contentType: contentType,
          ext: ext
        };
        staticCache.set(targetFile, cached);
      } catch (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(`500 Server Error: ${readErr.code}`);
      }
    }

    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && clientEtag === cached.etag) {
      res.writeHead(304, {
        'ETag': cached.etag,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end();
    }

    const acceptEncoding = req.headers['accept-encoding'] || '';
    const shouldGzip = !!(cached.gzipBuffer && acceptEncoding.includes('gzip'));
    const headers = {
      'Content-Type': cached.contentType,
      'ETag': cached.etag,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*'
    };

    if (shouldGzip) {
      headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = cached.gzipBuffer.length;
      res.writeHead(200, headers);
      res.end(cached.gzipBuffer);
    } else {
      headers['Content-Length'] = cached.size;
      res.writeHead(200, headers);
      res.end(cached.rawBuffer);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Energy Tap Server & Backend API running on port ${PORT}`);
  console.log(`👉 Game Client:  http://localhost:${PORT}/`);
  console.log(`👉 Admin Portal: http://localhost:${PORT}/admin/`);
  console.log(`👉 Backend API:  http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = server;
