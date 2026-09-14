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

async function testBearer() {
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const authRes = await request(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { returnSecureToken: true });

  const token = authRes.data.idToken;
  const uid = authRes.data.localId;
  console.log('Got token for UID:', uid);

  // Test with Bearer header
  const r1 = await request(`${DATABASE_URL}/players/${uid}.json`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('GET with Bearer:', r1.statusCode, r1.data);

  // Test PUT with Bearer
  const r2 = await request(`${DATABASE_URL}/players/${uid}.json`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    updatedAt: Date.now(),
    player: { name: "TestPlayer", level: 1, coins: 10 }
  });
  console.log('PUT with Bearer:', r2.statusCode, r2.data);
}

testBearer();
