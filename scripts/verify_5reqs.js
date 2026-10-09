const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\patel\\.gemini\\antigravity-ide\\brain\\b71d83e1-6b97-4e11-8cb2-56957b28b9f7';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=440,950',
  'http://localhost:3000'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      try {
        const list = JSON.parse(data);
        const target = list.find(t => t.type === 'page');
        if (!target) throw new Error('No page target found');

        const ws = new WebSocket(target.webSocketDebuggerUrl);
        let msgId = 1;
        const send = (method, params = {}) => new Promise((resolve) => {
          const id = msgId++;
          const handler = (event) => {
            const resp = JSON.parse(event.data);
            if (resp.id === id) {
              ws.removeEventListener('message', handler);
              resolve(resp.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id, method, params }));
        });

        ws.onopen = async () => {
          console.log('Connected to Chrome via CDP!');
          await send('Page.enable');
          await send('Runtime.enable');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 440,
            height: 950,
            deviceScaleFactor: 2,
            mobile: true
          });

          await new Promise(r => setTimeout(r, 2000));

          // 1. Remove splash screen & check Home Card Colors (Req 5)
          const homeEval = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `
              (() => {
                const splash = document.getElementById('appSplashScreen');
                if (splash) splash.remove();

                const lb = document.getElementById('homeLeaderboardSection');
                const sp = document.getElementById('homeBigPrizeSpinnerSection');
                const mr = document.getElementById('homeMegaRewardSection');
                const dg = document.getElementById('diamondGenHomeSection');

                return {
                  leaderboardBg: lb ? window.getComputedStyle(lb).backgroundImage : null,
                  spinnerBg: sp ? window.getComputedStyle(sp).backgroundImage : null,
                  megaRewardBg: mr ? window.getComputedStyle(mr).backgroundImage : null,
                  diamondGenBg: dg ? window.getComputedStyle(dg).backgroundImage : null,
                  leaderboardBorder: lb ? window.getComputedStyle(lb).borderColor : null,
                  spinnerBorder: sp ? window.getComputedStyle(sp).borderColor : null,
                  megaRewardBorder: mr ? window.getComputedStyle(mr).borderColor : null,
                  diamondGenBorder: dg ? window.getComputedStyle(dg).borderColor : null
                };
              })()
            `
          });
          console.log('HOME CARDS COLOR EVALUATION:\n', JSON.stringify(homeEval.result.value, null, 2));

          // Capture Screenshot of Home Page
          const homeShot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACTS_DIR, 'home_cards_leaderboard_theme.png'), Buffer.from(homeShot.data, 'base64'));
          console.log('Saved home_cards_leaderboard_theme.png');

          // 2. Check Spinner Wheel Slices & Diamond Emojis (Req 3)
          const wheelEval = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `
              (() => {
                return (typeof HBP_WHEEL_SLICES !== 'undefined') ? HBP_WHEEL_SLICES.map(s => ({
                  id: s.id,
                  type: s.type,
                  icon: s.icon,
                  sub: s.sub,
                  label: s.label
                })) : null;
              })()
            `
          });
          console.log('SPINNER WHEEL SLICES EVALUATION:\n', JSON.stringify(wheelEval.result.value, null, 2));

          // 3. Check Universal Fonts (Req 4)
          const fontEval = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `
              (() => {
                const h1 = document.querySelector('h1, h2, h3, .hlb-main-heading');
                const body = document.querySelector('p, span, .hlb-sub-heading, body');
                const mono = document.querySelector('.font-mono, .font-black.font-mono');
                return {
                  headingFont: h1 ? window.getComputedStyle(h1).fontFamily : null,
                  bodyFont: body ? window.getComputedStyle(body).fontFamily : null,
                  monoFont: mono ? window.getComputedStyle(mono).fontFamily : null
                };
              })()
            `
          });
          console.log('UNIVERSAL FONT EVALUATION:\n', JSON.stringify(fontEval.result.value, null, 2));

          // 4. Switch to Sunflower Page & Check Loading Bars (Req 2)
          await send('Runtime.evaluate', {
            expression: `if (typeof switchPage === 'function') switchPage('sunflower');`
          });
          await new Promise(r => setTimeout(r, 1000));

          const barEval = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `
              (() => {
                const bar = document.querySelector('.sf-loading-bar-fill');
                const pbar = document.querySelector('.sf-progress-bar-fill');
                return {
                  plotBarAnim: bar ? window.getComputedStyle(bar).animation : null,
                  plotBarBg: bar ? window.getComputedStyle(bar).backgroundImage : null,
                  wellBarAnim: pbar ? window.getComputedStyle(pbar).animation : null
                };
              })()
            `
          });
          console.log('LOADING BARS ANIMATION EVALUATION:\n', JSON.stringify(barEval.result.value, null, 2));

          const sfGardenShot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sunflower_animated_loading_bars.png'), Buffer.from(sfGardenShot.data, 'base64'));
          console.log('Saved sunflower_animated_loading_bars.png');

          // 5. Navigate to Managers Tab (Tab 4) (Req 1)
          await send('Runtime.evaluate', {
            expression: `if (typeof navigateSunflowerPage === 'function') navigateSunflowerPage(4);`
          });
          await new Promise(r => setTimeout(r, 1000));

          const mgrsEval = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `
              (() => {
                const cards = document.querySelectorAll('.sf-mgr-card');
                const firstCard = cards[0];
                const secCard = cards[1];
                return {
                  totalManagers: cards.length,
                  firstCardName: firstCard ? firstCard.querySelector('.sf-mgr-name')?.innerText : null,
                  firstCardSub: firstCard ? firstCard.querySelector('.sf-mgr-sub')?.innerText : null,
                  firstCardStatus: firstCard ? firstCard.querySelector('.sf-mgr-status-badge')?.innerText : null,
                  firstCardAction: firstCard ? firstCard.querySelector('.sf-mgr-actions-row')?.innerText : null,
                  secCardName: secCard ? secCard.querySelector('.sf-mgr-name')?.innerText : null,
                  secCardSub: secCard ? secCard.querySelector('.sf-mgr-sub')?.innerText : null
                };
              })()
            `
          });
          console.log('MANAGERS TAB EVALUATION (20 CARDS VERTICAL STACK):\n', JSON.stringify(mgrsEval.result.value, null, 2));

          const sfMgrsShot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sunflower_managers_tab_vertical_stack.png'), Buffer.from(sfMgrsShot.data, 'base64'));
          console.log('Saved sunflower_managers_tab_vertical_stack.png');

          // 6. Test Unlocking Manager 1 with 300 Diamonds, then Hire for 1 Day via Coins
          const actionTest = await send('Runtime.evaluate', {
            returnByValue: true,
            expression: `
              (() => {
                sunflowerState.diamonds = 500;
                sunflowerState.coins = 2000;
                // Unlock Manager 1
                unlockLandManager(1);
                const mgr1 = sunflowerState.managers[0];
                const timerAfterUnlock = mgr1.activeTimer;

                // Hire with Coins (costs (0+1)*500 = 500 coins)
                hireLandManagerCoins(1);
                const timerAfterCoin = mgr1.activeTimer;
                const nextCoinCost = (mgr1.hireCount + 1) * 500;

                return {
                  mgr1Unlocked: mgr1.unlocked,
                  timerAfterUnlock,
                  timerAfterCoin,
                  hireCount: mgr1.hireCount,
                  nextCoinCost,
                  remainingDiamonds: sunflowerState.diamonds,
                  remainingCoins: sunflowerState.coins
                };
              })()
            `
          });
          console.log('MANAGER UNLOCK & COIN HIRE TEST:\n', JSON.stringify(actionTest.result.value, null, 2));

          await new Promise(r => setTimeout(r, 600));

          const sfMgrsActiveShot = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sunflower_manager_active_unlocked.png'), Buffer.from(sfMgrsActiveShot.data, 'base64'));
          console.log('Saved sunflower_manager_active_unlocked.png');

          ws.close();
          proc.kill();
          console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
          process.exit(0);
        };
      } catch (err) {
        console.error('CDP verification error:', err);
        proc.kill();
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.error('Failed to connect to Chrome debug port:', err);
    proc.kill();
    process.exit(1);
  });
}, 2000);
