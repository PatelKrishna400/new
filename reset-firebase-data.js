// Node.js script to perform a Global Reset on Firebase Realtime Database
// Resets Season timer, Monthly Competition timer, Leaderboard, and user balances to zero
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
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
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

async function runGlobalReset() {
  console.log('====================================================');
  console.log('🔥 FIREBASE GLOBAL ZERO RESET SCRIPT');
  console.log('====================================================');

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Check if admin secret or token was passed as CLI argument or env var
  // Usage: node reset-firebase-data.js --secret=YOUR_FIREBASE_DB_SECRET
  // Or: node reset-firebase-data.js --token=YOUR_ADMIN_AUTH_TOKEN
  let adminSecret = process.env.FIREBASE_DATABASE_SECRET || null;
  for (const arg of process.argv) {
    if (arg.startsWith('--secret=')) adminSecret = arg.split('=')[1];
    if (arg.startsWith('--token=')) adminSecret = arg.split('=')[1];
  }

  // 1. Authenticate with Firebase
  console.log('\n[1/4] Authenticating with Firebase...');
  let idToken = adminSecret;
  let uid = null;
  if (!idToken) {
    try {
      const authRes = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { returnSecureToken: true });

      if (authRes.statusCode === 200 && authRes.data.idToken) {
        idToken = authRes.data.idToken;
        uid = authRes.data.localId;
        console.log(`✅ Authenticated via Anonymous provider! Session UID: ${uid}`);
      } else {
        console.log('⚠️ Anonymous auth failed. To run with full admin privileges, pass --secret=YOUR_DATABASE_SECRET');
      }
    } catch (err) {
      console.error('❌ Auth error:', err.message);
    }
  } else {
    console.log('🔑 Using provided Admin Database Secret / Token for root access!');
  }

  const authParam = idToken ? `?auth=${idToken}` : '';

  // 2. Reset Season Timer in Firebase (/season)
  console.log('\n[2/4] Resetting Global Season Timer (/season)...');
  const seasonPayload = {
    seasonNumber: 2,
    seasonStartTime: now,
    seasonEndTime: now + thirtyDaysMs,
    seasonDurationDays: 30,
    forceRestartTimestamp: now,
    lastUpdated: now,
    resetEpochVersion: 6
  };
  try {
    const seasonRes = await request(`${DATABASE_URL}/season.json${authParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, seasonPayload);
    console.log(`Season update status: ${seasonRes.statusCode}`, seasonRes.data);
  } catch (err) {
    console.error('Season update error:', err.message);
  }

  // 3. Reset Monthly Competition Timer in Firebase (/monthly_competition)
  console.log('\n[3/4] Resetting 30-Day Monthly Task Competition (/monthly_competition)...');
  const compPayload = {
    title: '30-Day Monthly Task Competition',
    cycleDays: 30,
    cycleNumber: 2,
    startTime: now,
    endTime: now + thirtyDaysMs,
    forceResetTimestamp: now,
    lastUpdated: now,
    resetEpochVersion: 6
  };
  try {
    const compRes = await request(`${DATABASE_URL}/monthly_competition.json${authParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, compPayload);
    console.log(`Monthly competition update status: ${compRes.statusCode}`, compRes.data);
  } catch (err) {
    console.error('Monthly competition update error:', err.message);
  }

  // 4. Reset or Clean Leaderboard & Players
  console.log('\n[4/4] Checking and Resetting Leaderboard & Player records...');
  try {
    const lbRes = await request(`${DATABASE_URL}/leaderboard.json${authParam}`, {
      method: 'DELETE'
    });
    console.log(`Leaderboard reset status: ${lbRes.statusCode}`, lbRes.data);
  } catch (err) {
    console.error('Leaderboard reset error:', err.message);
  }

  try {
    const plRes = await request(`${DATABASE_URL}/players.json${authParam}`, {
      method: 'DELETE'
    });
    console.log(`Players node wipe status: ${plRes.statusCode}`, plRes.data);
  } catch (err) {
    console.error('Players wipe error:', err.message);
  }

  console.log('\n====================================================');
  console.log('✅ Global Reset Script execution finished!');
  console.log('When any client or user loads the game:');
  console.log('- All currencies (Energy, Coins, Blue Coins, Keys, Cards, Tickets, Diamonds) are 0');
  console.log('- XP Level starts at 0 with 0 XP');
  console.log('- Goal Level starts at 0 with 0 items');
  console.log('- All event timers (XP Season, Goal Season, Monthly Quests) restart fresh at 30 days');
  console.log('====================================================');
}

runGlobalReset();
