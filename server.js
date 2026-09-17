const http = require('http');
const fs = require('fs');
const path = require('path');

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

// In-Memory Cloud Sync Fallback Caches
let memoryStore = {
  rewards: [],
  requests: [],
  users: {},
  websiteTasks: [],
  telegramTasks: [],
  gameConfig: {
    appName: 'Energy Tap',
    maintenanceMode: false,
    announcementText: '',
    announcementActive: false
  }
};

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

        // Duplicate Check: Check if user exists by UID or Profile Code
        const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '');
        const profileCode = body.profileCode || ('ET-' + (cleanUid.length >= 6 ? cleanUid.slice(-6).toUpperCase() : uid.toUpperCase()));

        // If user already exists, UPDATE rather than create duplicate
        const existingByCode = Object.values(memoryStore.users).find(u => u.profileCode === profileCode && u.uid !== uid);
        if (existingByCode) {
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

  // Check existence
  fs.stat(targetFile, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(targetFile, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(`500 Server Error: ${readErr.code}`);
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
    });
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
