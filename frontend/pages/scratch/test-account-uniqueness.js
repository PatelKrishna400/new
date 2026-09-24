const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Account Uniqueness & Authorization System Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, name, details = '') {
    if (cond) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Check Auth Config
    console.log('--- TEST 1: Auth Config Default Rules ---');
    const cfgRes = await request('GET', '/api/auth/config');
    assert(cfgRes.status === 200 && cfgRes.data.ok, 'Auth config endpoint responded');
    assert(cfgRes.data.config.oneTelegramPerAccount === true, 'One Telegram = One Account is ON by default');
    assert(cfgRes.data.config.onePhonePerAccount === true, 'One Phone = One Account is ON by default');
    assert(cfgRes.data.config.oneEmailPerAccount === true, 'One Email = One Account is ON by default');

    // 2. Telegram Authorization - First Login (Create)
    console.log('\n--- TEST 2: Telegram Authorization First Login ---');
    const tgId1 = '99887766';
    const tgAuth1 = await request('POST', '/api/auth/telegram', {
      user: { id: tgId1, username: 'player_one', first_name: 'Player', last_name: 'One' }
    });
    assert(tgAuth1.status === 200 && tgAuth1.data.ok, 'First Telegram login succeeded');
    assert(tgAuth1.data.isNew === true, 'First Telegram login detected new account');
    const uid1 = tgAuth1.data.uid;
    assert(Boolean(uid1), 'Assigned UID for Telegram user', uid1);

    // 3. Telegram Authorization - Second Login (Must Reuse Account)
    console.log('\n--- TEST 3: Telegram Authorization Second Login (Re-login Existing) ---');
    const tgAuth2 = await request('POST', '/api/auth/telegram', {
      user: { id: tgId1, username: 'player_one_renamed', first_name: 'Player', last_name: 'OneRenamed' }
    });
    assert(tgAuth2.status === 200 && tgAuth2.data.ok, 'Second Telegram login succeeded');
    assert(tgAuth2.data.isNew === false, 'Existing Telegram account recognized (not new)');
    assert(tgAuth2.data.uid === uid1, 'Reused same UID (no duplicate account spawned)', `uid1: ${uid1}, uid2: ${tgAuth2.data.uid}`);

    // 4. Link Phone to Account 1
    console.log('\n--- TEST 4: Phone Number Linking & Uniqueness ---');
    const phone1 = '1234567890';
    const linkPhone1 = await request('POST', '/api/auth/link-credential', {
      type: 'phone',
      value: phone1,
      uid: uid1
    });
    assert(linkPhone1.status === 200 && linkPhone1.data.ok, 'Linked phone to account 1');

    // Check identifier status for Phone 1
    const chkPhone1 = await request('GET', `/api/auth/check-identifier?type=phone&value=${phone1}&currentUid=${uid1}`);
    assert(chkPhone1.data.exists === true, 'Phone 1 recognized as existing in identityIndex');
    assert(chkPhone1.data.isSelf === true, 'Phone 1 recognized as belonging to account 1 itself');

    // Attempting to link Phone 1 to a DIFFERENT UID
    const uid2 = 'player_uid_stranger_2';
    const chkPhoneStranger = await request('GET', `/api/auth/check-identifier?type=phone&value=${phone1}&currentUid=${uid2}`);
    assert(chkPhoneStranger.data.exists === true && chkPhoneStranger.data.isSelf === false, 'Stranger detected Phone 1 as already in use by another account');

    const linkPhoneStranger = await request('POST', '/api/auth/link-credential', {
      type: 'phone',
      value: phone1,
      uid: uid2
    });
    assert(linkPhoneStranger.status === 409 || !linkPhoneStranger.data.ok, 'Server blocked stranger from linking existing phone');
    assert(linkPhoneStranger.data.error.includes('already linked to an existing account'), 'Returned standard conflict message for phone', linkPhoneStranger.data.error);

    // 5. Email Uniqueness
    console.log('\n--- TEST 5: Email Uniqueness & Account Linking ---');
    const email1 = 'alex.vance@example.com';
    const linkEmail1 = await request('POST', '/api/auth/link-credential', {
      type: 'email',
      value: email1,
      uid: uid1
    });
    assert(linkEmail1.status === 200 && linkEmail1.data.ok, 'Linked email to account 1');

    // Attempting to link Email 1 to a DIFFERENT UID
    const linkEmailStranger = await request('POST', '/api/auth/link-credential', {
      type: 'email',
      value: email1,
      uid: uid2
    });
    assert(linkEmailStranger.status === 409 || !linkEmailStranger.data.ok, 'Server blocked stranger from linking existing email');
    assert(linkEmailStranger.data.error.includes('already linked to an existing account'), 'Returned standard conflict message for email', linkEmailStranger.data.error);

    // 6. Duplicate Detection & Migration Tool
    console.log('\n--- TEST 6: Duplicate Detection & Migration Tool ---');
    const migRes = await request('POST', '/api/auth/migrate-indexes');
    assert(migRes.status === 200 && migRes.data.ok, 'Index migration tool executed');
    assert(migRes.data.migration.indexedTelegram >= 1, 'Indexed Telegram accounts');

    const dupRes = await request('GET', '/api/auth/duplicates');
    assert(dupRes.status === 200 && dupRes.data.ok, 'Duplicate detection tool responded');
    console.log(`Duplicate groups detected: ${dupRes.data.duplicates.length}`);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log(`\n=================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
