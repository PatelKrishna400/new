// Node.js script to test Firebase connection, Auth, and RTDB paths
const https = require('https');

const API_KEY = "AIzaSyDnujl5_iBlSzwDfjCLA7sFQ7zW1DxROic";
const DATABASE_URL = "https://tap-game-80070-default-rtdb.firebaseio.com";

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testFirebase() {
  console.log('=== 1. Testing Firebase Auth Anonymous Sign-In ===');
  let idToken = null;
  let localId = null;
  try {
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
    const authRes = await request(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { returnSecureToken: true });

    console.log('Auth HTTP Status:', authRes.statusCode);
    if (authRes.statusCode === 200 && authRes.data.idToken) {
      console.log('✅ Firebase Anonymous Auth SUCCESSFUL!');
      console.log('UID:', authRes.data.localId);
      idToken = authRes.data.idToken;
      localId = authRes.data.localId;
    } else {
      console.error('❌ Firebase Auth Failed:', authRes.data);
    }
  } catch (err) {
    console.error('❌ Auth error:', err.message);
  }

  console.log('\n=== 2. Testing RTDB Read without Auth ===');
  const pathsToTest = [
    'players',
    'leaderboard',
    'mega_rewards',
    'reward_requests',
    'suggestions',
    'website_tasks_config',
    'telegram_tasks_config',
    'monthly_competition',
    'season',
    'ads_config',
    'whitelist'
  ];

  for (const p of pathsToTest) {
    try {
      const res = await request(`${DATABASE_URL}/${p}.json?shallow=true`);
      if (res.statusCode === 200) {
        console.log(`✅ [Unauth Read] /${p} - HTTP 200 OK:`, typeof res.data === 'object' ? Object.keys(res.data || {}).length + ' keys' : res.data);
      } else {
        console.log(`⚠️ [Unauth Read] /${p} - HTTP ${res.statusCode}:`, res.data);
      }
    } catch (e) {
      console.log(`❌ [Unauth Read] /${p} - Error:`, e.message);
    }
  }

  if (idToken && localId) {
    console.log('\n=== 3. Testing RTDB Read & Write WITH Authenticated Token ===');
    for (const p of pathsToTest) {
      try {
        const res = await request(`${DATABASE_URL}/${p}.json?auth=${idToken}&shallow=true`);
        console.log(`[Auth Read] /${p} - HTTP ${res.statusCode}:`, res.statusCode === 200 ? 'OK' : res.data);
      } catch (e) {
        console.log(`[Auth Read] /${p} - Error:`, e.message);
      }
    }

    // Test writing a player state
    console.log('\n=== 4. Testing Write to /players/{localId} with Auth ===');
    try {
      const testPayload = {
        updatedAt: Date.now(),
        player: {
          name: "Tester",
          level: 1,
          coins: 100
        }
      };
      const writeRes = await request(`${DATABASE_URL}/players/${localId}.json?auth=${idToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, testPayload);
      console.log('Write /players/{localId} Status:', writeRes.statusCode, writeRes.data);

      // Clean up test player
      await request(`${DATABASE_URL}/players/${localId}.json?auth=${idToken}`, { method: 'DELETE' });
      console.log('Cleaned up test player node.');
    } catch (e) {
      console.error('Write error:', e.message);
    }

    // Test writing to leaderboard
    console.log('\n=== 5. Testing Write to /leaderboard/{localId} with Auth ===');
    try {
      const lbPayload = {
        name: "Tester",
        level: 1,
        coins: 100,
        energyTaps: 10,
        lastActive: Date.now()
      };
      const lbRes = await request(`${DATABASE_URL}/leaderboard/${localId}.json?auth=${idToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, lbPayload);
      console.log('Write /leaderboard/{localId} Status:', lbRes.statusCode, lbRes.data);

      await request(`${DATABASE_URL}/leaderboard/${localId}.json?auth=${idToken}`, { method: 'DELETE' });
      console.log('Cleaned up test leaderboard node.');
    } catch (e) {
      console.error('Leaderboard write error:', e.message);
    }
  }

  // Also check without auth write to see if rules reject unauth writes
  console.log('\n=== 6. Testing Unauthenticated Write (Security Rule check) ===');
  try {
    const unauthWrite = await request(`${DATABASE_URL}/players/unauth_test.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { updatedAt: Date.now() });
    console.log('Unauth Write Status:', unauthWrite.statusCode, unauthWrite.data);
  } catch (e) {
    console.log('Unauth write error:', e.message);
  }
}

testFirebase();
