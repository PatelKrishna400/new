const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const staticCache = new Map(); // targetFile -> { mtimeMs, size, rawBuffer, gzipBuffer, etag, contentType, ext }

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const ADMIN_DIR = path.join(__dirname, 'admin');

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

// Persistent Cloud/Local JSON Database File
const DB_FILE = path.join(__dirname, 'backend', 'database.json');

// In-Memory Cloud Sync Fallback Caches
let memoryStore = {
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
    announcementText: 'Welcome to Energy Tap! Season 2 Quests Active.',
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

function loadDatabaseFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (data.users && typeof data.users === 'object') memoryStore.users = data.users;
        if (Array.isArray(data.rewards)) memoryStore.rewards = data.rewards;
        if (Array.isArray(data.requests)) memoryStore.requests = data.requests;
        if (Array.isArray(data.websiteTasks)) memoryStore.websiteTasks = data.websiteTasks;
        if (Array.isArray(data.telegramTasks)) memoryStore.telegramTasks = data.telegramTasks;
        if (data.gameConfig) memoryStore.gameConfig = { ...memoryStore.gameConfig, ...data.gameConfig };
        if (data.levelsConfig) memoryStore.levelsConfig = data.levelsConfig;
        if (Array.isArray(data.activityLog)) memoryStore.antiFraud.auditLog = data.activityLog;

        Object.values(memoryStore.users).forEach(u => {
          if (u.profileCode) memoryStore.usersByProfileCode[u.profileCode] = u.uid;
        });
        console.log(`📦 Loaded persistent database from ${DB_FILE}: ${Object.keys(memoryStore.users).length} users, ${memoryStore.requests.length} requests, ${memoryStore.rewards.length} rewards.`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Error reading persistent database from disk:', err.message);
  }
}

let _saveDbTimer = null;
function saveDatabaseToDisk(immediate = false) {
  const doSave = () => {
    try {
      const data = {
        users: memoryStore.users,
        rewards: memoryStore.rewards,
        requests: memoryStore.requests,
        websiteTasks: memoryStore.websiteTasks,
        telegramTasks: memoryStore.telegramTasks,
        gameConfig: memoryStore.gameConfig,
        levelsConfig: memoryStore.levelsConfig,
        activityLog: memoryStore.antiFraud.auditLog,
        updatedAt: Date.now()
      };
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('⚠️ Failed writing database to disk:', e.message);
    }
  };

  if (immediate) {
    clearTimeout(_saveDbTimer);
    _saveDbTimer = null;
    doSave();
  } else {
    if (_saveDbTimer) clearTimeout(_saveDbTimer);
    _saveDbTimer = setTimeout(doSave, 300);
  }
}

// Initial boot load
loadDatabaseFromDisk();

// Identity Normalization Helpers
function normalizeTelegramId(id) {
  if (!id) return '';
  return String(id).trim();
}
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits;
}
function normalizeEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
}

// Helper: parse request body
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

// Helper: Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Server Creation
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
          if (body.notes !== undefined) reqItem.notes = body.notes;
          reqItem.updatedAt = Date.now();
          saveDatabaseToDisk();
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

        // Duplicate Check: Check if user exists by UID or Profile Code
        const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '');
        const profileCode = body.profileCode || ('ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : uid.toUpperCase()));

        // If user already exists, UPDATE rather than create duplicate
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
        saveDatabaseToDisk();
        return sendJson(res, 200, { ok: true, user: updatedUser });
      }

      if (req.method === 'PUT') {
        const uid = apiRoute.replace('/users/', '');
        const body = await parseRequestBody(req);
        if (uid) {
          memoryStore.users[uid] = {
            ...(memoryStore.users[uid] || { uid }),
            ...body,
            updatedAt: Date.now()
          };
          if (body.profileCode) memoryStore.usersByProfileCode[body.profileCode] = uid;
          saveDatabaseToDisk();
          return sendJson(res, 200, { ok: true, user: memoryStore.users[uid] });
        }
        return sendJson(res, 400, { ok: false, error: 'User UID required' });
      }

      if (req.method === 'DELETE') {
        const uid = apiRoute.replace('/users/', '');
        if (uid && memoryStore.users[uid]) {
          delete memoryStore.users[uid];
          saveDatabaseToDisk();
          return sendJson(res, 200, { ok: true, message: 'User deleted from database' });
        }
        return sendJson(res, 404, { ok: false, error: 'User not found' });
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

      // POST /api/tasks/website
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

      // POST /api/tasks/telegram
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

      // DELETE /api/tasks/website/:id
      if (apiRoute.startsWith('/tasks/website/') && req.method === 'DELETE') {
        const id = apiRoute.replace('/tasks/website/', '');
        memoryStore.websiteTasks = memoryStore.websiteTasks.filter(t => t.id !== id);
        return sendJson(res, 200, { ok: true });
      }

      // DELETE /api/tasks/telegram/:id
      if (apiRoute.startsWith('/tasks/telegram/') && req.method === 'DELETE') {
        const id = apiRoute.replace('/tasks/telegram/', '');
        memoryStore.telegramTasks = memoryStore.telegramTasks.filter(t => t.id !== id);
        return sendJson(res, 200, { ok: true });
      }
    }

    // 6. Global Game Configuration API (/api/game-config)
    if (apiRoute === '/game-config' || apiRoute === '/game_config') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { ok: true, gameConfig: memoryStore.gameConfig });
      }

      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        memoryStore.gameConfig = {
          ...memoryStore.gameConfig,
          ...body,
          updatedAt: Date.now()
        };
        return sendJson(res, 200, { ok: true, gameConfig: memoryStore.gameConfig });
      }
    }

    // 7. Level Progression Configuration API (/api/levels-config)
    if (apiRoute === '/levels-config' || apiRoute.startsWith('/levels-config/')) {
      if (req.method === 'GET') {
        return sendJson(res, 200, { ok: true, levelsConfig: memoryStore.levelsConfig });
      }

      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (body && typeof body === 'object') {
          memoryStore.levelsConfig = { ...memoryStore.levelsConfig, ...body };
          return sendJson(res, 200, { ok: true, levelsConfig: memoryStore.levelsConfig });
        }
        return sendJson(res, 400, { ok: false, error: 'Invalid levels configuration format' });
      }

      if (req.method === 'PUT') {
        const lvlId = apiRoute.replace('/levels-config/', '');
        const body = await parseRequestBody(req);
        if (lvlId && body) {
          memoryStore.levelsConfig[lvlId] = { ...body, updatedAt: Date.now() };
          return sendJson(res, 200, { ok: true, level: memoryStore.levelsConfig[lvlId] });
        }
        return sendJson(res, 400, { ok: false, error: 'Level ID and payload required' });
      }
    }

    // 8. Fuel Cells Configuration & Purchases API
    if (apiRoute === '/fuel-cells-config' || apiRoute === '/fuel_cells_config') {
      if (req.method === 'GET') {
        return sendJson(res, 200, { ok: true, fuelCellsConfig: memoryStore.fuelCellsConfig || {} });
      }
      if (req.method === 'POST') {
        const body = await parseRequestBody(req);
        memoryStore.fuelCellsConfig = { ...(memoryStore.fuelCellsConfig || {}), ...body, updatedAt: Date.now() };
        return sendJson(res, 200, { ok: true, fuelCellsConfig: memoryStore.fuelCellsConfig });
      }
    }

    if (apiRoute.startsWith('/fuel/buy') || apiRoute.startsWith('/shop/fuel/buy')) {
      const body = await parseRequestBody(req);
      return sendJson(res, 200, {
        ok: true,
        success: true,
        message: 'Energy fuel cell purchase approved and recorded.',
        transaction: {
          fuelType: body.fuelType || 'green',
          method: body.method || 'coins',
          cost: body.cost || 0,
          timestamp: Date.now()
        }
      });
    }

    // ==========================================================================
    // NOTIFICATION CENTER APIS (/api/notifications)
    // ==========================================================================
    if (apiRoute === '/notifications' || apiRoute.startsWith('/notifications')) {
      if (req.method === 'GET') {
        return sendJson(res, 200, {
          ok: true,
          notifications: memoryStore.notifications || []
        });
      }

      // Admin Broadcast Notification
      if (apiRoute === '/notifications' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (!body.title || !body.message) {
          return sendJson(res, 400, { ok: false, error: 'Title and message are required' });
        }

        const newNotif = {
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          type: body.type || 'global', // global, event, maintenance, reward
          title: body.title,
          message: body.message,
          timestamp: Date.now(),
          read: false,
          actionText: body.actionText || 'View',
          actionTarget: body.actionTarget || 'home'
        };

        if (!memoryStore.notifications) memoryStore.notifications = [];
        memoryStore.notifications.unshift(newNotif);

        // Keep last 50 notifications
        if (memoryStore.notifications.length > 50) {
          memoryStore.notifications = memoryStore.notifications.slice(0, 50);
        }

        return sendJson(res, 201, { ok: true, notification: newNotif });
      }

      // Mark notification(s) as read
      if (apiRoute === '/notifications/mark-read' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        if (body.all) {
          (memoryStore.notifications || []).forEach(n => { n.read = true; });
        } else if (body.id) {
          const target = (memoryStore.notifications || []).find(n => n.id === body.id);
          if (target) target.read = true;
        }
        return sendJson(res, 200, { ok: true, notifications: memoryStore.notifications });
      }
    }

    // ==========================================================================
    // ANTI-FRAUD & SERVER-AUTHORITATIVE REWARD VALIDATION (/api/reward/claim)
    // ==========================================================================
    if (apiRoute === '/reward/claim' && req.method === 'POST') {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const body = await parseRequestBody(req);

      const { uid, nonce, action, payload } = body;

      if (!uid || !action || !nonce) {
        return sendJson(res, 400, { ok: false, error: 'Missing uid, action, or nonce in claim payload' });
      }

      // 1. Replay Attack & Duplicate Claim Prevention
      if (memoryStore.antiFraud.processedNonces[nonce]) {
        return sendJson(res, 409, {
          ok: false,
          error: 'Duplicate claim transaction: nonce already processed',
          duplicate: true
        });
      }

      // 2. Cooldown Checks per User and Action
      const now = Date.now();
      const userCd = memoryStore.antiFraud.userCooldowns[uid] || {};
      const lastActionTime = userCd[action] || 0;

      const MIN_COOLDOWNS = {
        mini_game_memory: 12000,  // Minimum 12 seconds between Memory Match finishes
        mini_game_catcher: 15000, // Minimum 15 seconds between Coin Catcher finishes
        ad_reward: 8000,          // Minimum 8 seconds between ad rewards
        daily_streak: 3600000,    // 1 hour cooldown between streak claims
        referral_claim: 5000
      };

      const requiredCd = MIN_COOLDOWNS[action] || 2000;
      if (now - lastActionTime < requiredCd) {
        return sendJson(res, 429, {
          ok: false,
          error: `Cooldown active for action '${action}'. Please wait.`,
          retryAfterMs: requiredCd - (now - lastActionTime)
        });
      }

      // 3. Rule & Mathematical Bounds Validation
      let approvedCoins = 0;
      let approvedDiamonds = 0;
      let approvedKeys = 0;

      if (action === 'mini_game_memory') {
        const timeRemaining = Number(payload.timeRemaining || 0);
        const mistakes = Number(payload.mistakes || 0);
        const stars = Number(payload.stars || 1);

        // Sanity bounds: Cannot complete in less than 5 seconds
        if (timeRemaining > 55) {
          return sendJson(res, 400, { ok: false, error: 'Impossible completion speed flagged by anti-fraud.' });
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

        // Max possible in 30s is roughly 1500 coins and 50 diamonds
        approvedCoins = Math.max(0, Math.min(1500, claimedCoins));
        approvedDiamonds = Math.max(0, Math.min(50, claimedDiamonds));
      } else if (action === 'ad_reward') {
        approvedCoins = Number(payload.coins || 100);
        approvedDiamonds = Number(payload.diamonds || 10);
      } else {
        approvedCoins = Math.min(500, Number(payload.coins || 0));
        approvedDiamonds = Math.min(50, Number(payload.diamonds || 0));
      }

      // 4. Record Nonce & Cooldown
      memoryStore.antiFraud.processedNonces[nonce] = now;
      if (!memoryStore.antiFraud.userCooldowns[uid]) {
        memoryStore.antiFraud.userCooldowns[uid] = {};
      }
      memoryStore.antiFraud.userCooldowns[uid][action] = now;

      // 5. Update Server-Authoritative User Balances
      if (!memoryStore.users[uid]) {
        memoryStore.users[uid] = {
          uid,
          player: { coins: 0, diamonds: 0, name: 'Player' },
          bank: { coins: 0, diamonds: 0, keys: 0 },
          updatedAt: now
        };
      }
      const userObj = memoryStore.users[uid];
      if (!userObj.player) userObj.player = { coins: 0, diamonds: 0 };
      if (!userObj.bank) userObj.bank = { coins: 0, diamonds: 0, keys: 0 };

      userObj.player.coins = (userObj.player.coins || 0) + approvedCoins;
      userObj.player.diamonds = (userObj.player.diamonds || 0) + approvedDiamonds;
      userObj.bank.diamonds = (userObj.bank.diamonds || 0) + approvedDiamonds;
      userObj.bank.keys = (userObj.bank.keys || 0) + approvedKeys;
      userObj.updatedAt = now;

      // 6. Audit Logging
      memoryStore.antiFraud.auditLog.unshift({
        uid,
        action,
        approvedCoins,
        approvedDiamonds,
        clientIp,
        userAgent: userAgent.slice(0, 80),
        status: 'approved',
        timestamp: now
      });
      if (memoryStore.antiFraud.auditLog.length > 100) {
        memoryStore.antiFraud.auditLog = memoryStore.antiFraud.auditLog.slice(0, 100);
      }

      console.log(`🛡️ Anti-Fraud Approved: User ${uid} claimed '${action}' -> +${approvedCoins} 🪙, +${approvedDiamonds} 💎`);

      return sendJson(res, 200, {
        ok: true,
        success: true,
        action,
        approvedRewards: {
          coins: approvedCoins,
          diamonds: approvedDiamonds,
          keys: approvedKeys
        },
        balances: {
          coins: userObj.player.coins,
          diamonds: userObj.bank.diamonds,
          keys: userObj.bank.keys
        }
      });
    }

    // Anti-Fraud Tap Verification API
    if (apiRoute === '/anti-fraud/verify-tap-session' && req.method === 'POST') {
      const body = await parseRequestBody(req);
      const { uid, tapCount, durationSeconds } = body;
      const validDuration = Math.max(1, Number(durationSeconds) || 1);
      const rate = Number(tapCount || 0) / validDuration;

      const isCritical = rate > 40; // Impossible human rate > 40 taps/sec
      const isSuspicious = rate > 25; // Highly improbable > 25 taps/sec

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

    // 9. Account Authorization & Identity Uniqueness APIs (/api/auth/...)
    if (apiRoute.startsWith('/auth')) {
      // POST /api/auth/telegram - Telegram Authorization & Uniqueness Enforcement
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

        // 1. Check if Telegram ID already mapped to an existing account
        const existingUid = memoryStore.identityIndex.telegram[tgId];
        if (existingUid) {
          const existingUser = memoryStore.users[existingUid] || { uid: existingUid };
          // Update lastLogin and latest handle
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

        // 2. Not existing: Check Phone and Email conflicts if provided before account creation
        const phone = normalizePhone(body.phone || body.mobile || uPayload.phone || uPayload.mobile);
        const email = normalizeEmail(body.email || uPayload.email);

        if (phone && memoryStore.identityIndex.phone[phone]) {
          const conflictingUid = memoryStore.identityIndex.phone[phone];
          return sendJson(res, 409, {
            ok: false,
            conflict: 'phone',
            conflictingUid,
            error: 'This phone number is already linked to an existing account. Please log in to your existing account.'
          });
        }

        if (email && memoryStore.identityIndex.email[email]) {
          const conflictingUid = memoryStore.identityIndex.email[email];
          return sendJson(res, 409, {
            ok: false,
            conflict: 'email',
            conflictingUid,
            error: 'This email is already linked to an existing account. Please log in to your existing account.'
          });
        }

        // 3. Create or provision new account with Telegram ID as primary immutable key
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
          phone: phone || '',
          email: email || '',
          phoneVerified: Boolean(phone && body.phoneVerified),
          emailVerified: Boolean(email && body.emailVerified),
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
        // Index Telegram ID
        memoryStore.identityIndex.telegram[tgId] = newUid;
        if (phone) memoryStore.identityIndex.phone[phone] = newUid;
        if (email) memoryStore.identityIndex.email[email] = newUid;

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

      // GET & POST /api/auth/check-identifier - Check availability and detect conflicts
      if (apiRoute === '/auth/check-identifier') {
        const body = req.method === 'POST' ? await parseRequestBody(req) : {};
        const q = parsedUrl.query || {};
        const targetType = body.type || q.type; // 'telegram' | 'phone' | 'email'
        const rawVal = body.value || q.value;
        const currentUid = body.currentUid || body.excludeUid || q.currentUid || q.excludeUid || '';

        if (!targetType || !rawVal) {
          return sendJson(res, 400, { ok: false, error: 'Type and value are required' });
        }

        let mappedUid = null;
        let conflictMsg = '';

        if (targetType === 'telegram') {
          const tgId = normalizeTelegramId(rawVal);
          mappedUid = memoryStore.identityIndex.telegram[tgId];
          conflictMsg = 'This Telegram account is already linked to an existing account. Please log in to your existing account.';
        } else if (targetType === 'phone' || targetType === 'mobile') {
          const phone = normalizePhone(rawVal);
          mappedUid = memoryStore.identityIndex.phone[phone];
          conflictMsg = 'This phone number is already linked to an existing account. Please log in to your existing account.';
        } else if (targetType === 'email') {
          const email = normalizeEmail(rawVal);
          mappedUid = memoryStore.identityIndex.email[email];
          conflictMsg = 'This email is already linked to an existing account. Please log in to your existing account.';
        }

        if (mappedUid) {
          const isSelf = (mappedUid === currentUid);
          return sendJson(res, 200, {
            ok: true,
            exists: true,
            isSelf,
            available: isSelf,
            linkedUid: mappedUid,
            conflict: isSelf ? null : targetType,
            conflictingUid: isSelf ? null : mappedUid,
            error: isSelf ? null : conflictMsg
          });
        }

        return sendJson(res, 200, {
          ok: true,
          exists: false,
          available: true,
          isSelf: false,
          linkedUid: null
        });
      }

      // POST /api/auth/link-credential - Link phone or email to existing account
      if (apiRoute === '/auth/link-credential' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const uid = body.uid;
        if (!uid) {
          return sendJson(res, 400, { ok: false, error: 'User UID is required' });
        }

        const user = memoryStore.users[uid] || { uid };

        const rawPhone = body.phone || (body.type === 'phone' || body.type === 'mobile' ? body.value : null);
        if (rawPhone) {
          const normP = normalizePhone(rawPhone);
          const existingOwner = memoryStore.identityIndex.phone[normP];
          if (existingOwner && existingOwner !== uid) {
            return sendJson(res, 409, {
              ok: false,
              conflict: 'phone',
              conflictingUid: existingOwner,
              error: 'This phone number is already linked to an existing account. Please log in to your existing account.'
            });
          }
          user.phone = normP;
          user.phoneVerified = true;
          memoryStore.identityIndex.phone[normP] = uid;
        }

        const rawEmail = body.email || (body.type === 'email' ? body.value : null);
        if (rawEmail) {
          const normE = normalizeEmail(rawEmail);
          const existingOwner = memoryStore.identityIndex.email[normE];
          if (existingOwner && existingOwner !== uid) {
            return sendJson(res, 409, {
              ok: false,
              conflict: 'email',
              conflictingUid: existingOwner,
              error: 'This email is already linked to an existing account. Please log in to your existing account.'
            });
          }
          user.email = normE;
          user.emailVerified = true;
          memoryStore.identityIndex.email[normE] = uid;
        }

        user.updatedAt = Date.now();
        memoryStore.users[uid] = user;

        return sendJson(res, 200, {
          ok: true,
          message: 'Credentials successfully linked to account.',
          user
        });
      }

      // GET & POST /api/auth/config - Account Authorization Settings
      if (apiRoute === '/auth/config' || apiRoute === '/auth_config') {
        if (req.method === 'GET') {
          return sendJson(res, 200, { ok: true, config: memoryStore.authConfig });
        }
        if (req.method === 'POST') {
          const body = await parseRequestBody(req);
          memoryStore.authConfig = {
            ...memoryStore.authConfig,
            ...body,
            updatedAt: Date.now()
          };
          return sendJson(res, 200, { ok: true, config: memoryStore.authConfig });
        }
      }

      // GET /api/auth/duplicates - Scan and report potential duplicates
      if (apiRoute === '/auth/duplicates' && req.method === 'GET') {
        const users = Object.values(memoryStore.users);
        const tgMap = {};
        const phoneMap = {};
        const emailMap = {};

        users.forEach(u => {
          const tg = normalizeTelegramId(u.telegramId);
          const ph = normalizePhone(u.phone || u.mobile);
          const em = normalizeEmail(u.email);

          if (tg) {
            tgMap[tg] = tgMap[tg] || [];
            tgMap[tg].push(u);
          }
          if (ph) {
            phoneMap[ph] = phoneMap[ph] || [];
            phoneMap[ph].push(u);
          }
          if (em) {
            emailMap[em] = emailMap[em] || [];
            emailMap[em].push(u);
          }
        });

        const duplicates = [];
        Object.entries(tgMap).forEach(([tgId, list]) => {
          if (list.length > 1) {
            duplicates.push({ type: 'telegram', identifier: tgId, count: list.length, accounts: list });
          }
        });
        Object.entries(phoneMap).forEach(([phone, list]) => {
          if (list.length > 1) {
            duplicates.push({ type: 'phone', identifier: phone, count: list.length, accounts: list });
          }
        });
        Object.entries(emailMap).forEach(([email, list]) => {
          if (list.length > 1) {
            duplicates.push({ type: 'email', identifier: email, count: list.length, accounts: list });
          }
        });

        return sendJson(res, 200, { ok: true, count: duplicates.length, duplicates });
      }

      // POST /api/auth/resolve-duplicate - Controlled admin duplicate resolution
      if (apiRoute === '/auth/resolve-duplicate' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const { action, uid, type, identifier } = body;

        if (!uid || !memoryStore.users[uid]) {
          return sendJson(res, 404, { ok: false, error: 'Account not found' });
        }

        const user = memoryStore.users[uid];

        if (action === 'disable') {
          user.status = 'disabled';
          user.disabledReason = 'Duplicate account flagged by Admin';
          user.updatedAt = Date.now();
          return sendJson(res, 200, { ok: true, message: `Account ${uid} has been disabled.` });
        }

        if (action === 'unlink') {
          if (type === 'phone') {
            const p = normalizePhone(user.phone);
            delete memoryStore.identityIndex.phone[p];
            user.phone = '';
            user.phoneVerified = false;
          } else if (type === 'email') {
            const e = normalizeEmail(user.email);
            delete memoryStore.identityIndex.email[e];
            user.email = '';
            user.emailVerified = false;
          } else if (type === 'telegram') {
            const t = normalizeTelegramId(user.telegramId);
            delete memoryStore.identityIndex.telegram[t];
            user.telegramId = '';
          }
          user.updatedAt = Date.now();
          return sendJson(res, 200, { ok: true, message: `Unlinked ${type} identifier from ${uid}.` });
        }

        return sendJson(res, 400, { ok: false, error: 'Unsupported resolution action' });
      }

      // POST /api/auth/migrate-indexes - Safely scan and populate identityIndex from existing players
      if (apiRoute === '/auth/migrate-indexes' && req.method === 'POST') {
        const users = Object.values(memoryStore.users);
        let tgIndexed = 0;
        let phoneIndexed = 0;
        let emailIndexed = 0;

        users.forEach(u => {
          const tg = normalizeTelegramId(u.telegramId);
          const ph = normalizePhone(u.phone || u.mobile);
          const em = normalizeEmail(u.email);

          if (tg && !memoryStore.identityIndex.telegram[tg]) {
            memoryStore.identityIndex.telegram[tg] = u.uid;
            tgIndexed++;
          }
          if (ph && !memoryStore.identityIndex.phone[ph]) {
            memoryStore.identityIndex.phone[ph] = u.uid;
            phoneIndexed++;
          }
          if (em && !memoryStore.identityIndex.email[em]) {
            memoryStore.identityIndex.email[em] = u.uid;
            emailIndexed++;
          }
        });

        return sendJson(res, 200, {
          ok: true,
          totalUsers: users.length,
          tgIndexed,
          phoneIndexed,
          emailIndexed,
          message: 'Identity indexes populated successfully.'
        });
      }
    }

    return sendJson(res, 404, { ok: false, error: 'API route not found' });
  }

  // ==========================================================================
  // STATIC FILES SERVING: ADMIN PORTAL (/admin) vs FRONTEND (/)
  // ==========================================================================
  let targetFile;

  if (pathname === '/admin' || pathname === '/admin/') {
    targetFile = path.join(ADMIN_DIR, 'index.html');
  } else if (pathname.startsWith('/admin/')) {
    const relPath = pathname.replace(/^\/admin\//, '');
    targetFile = path.join(ADMIN_DIR, relPath);
  } else {
    // Frontend
    const relPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    targetFile = path.join(FRONTEND_DIR, relPath);
    // If not found in frontend, check root (e.g. style.css)
    if (!fs.existsSync(targetFile)) {
      const rootFallback = path.join(__dirname, relPath);
      if (fs.existsSync(rootFallback) && !fs.statSync(rootFallback).isDirectory()) {
        targetFile = rootFallback;
      }
    }
  }

  // High-Performance In-Memory Static File Cache with HTTP 304 ETags and Gzip Compression
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

    // 1. ETag & HTTP 304 Validation
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && clientEtag === cached.etag) {
      res.writeHead(304, {
        'ETag': cached.etag,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end();
    }

    // 2. Gzip Serving if supported
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
