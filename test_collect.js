const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const proc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:3000'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      const list = JSON.parse(data);
      const target = list.find(t => t.type === 'page');
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
        await send('Page.enable');
        await send('Runtime.enable');
        await new Promise(r => setTimeout(r, 4000));

        await send('Runtime.evaluate', {
          expression: `
            const sp = document.getElementById('appSplashScreen');
            if (sp) sp.remove();
            if (typeof switchPage === 'function') switchPage('sunflower');
          `
        });
        await new Promise(r => setTimeout(r, 1000));

        // Test Land Collect
        const landTest = await send('Runtime.evaluate', {
          expression: `
            (() => {
              try {
                // Check plot 1
                const p = sunflowerState.plots[0];
                const btn = document.getElementById('sfPlotCollectBtn-1');
                
                // Let's call openSfCollectModal(1) directly
                const hasFn = typeof openSfCollectModal === 'function';
                openSfCollectModal(1);
                const modal = document.getElementById('sfCollectProfitModal');
                const modalOpen = modal && !modal.classList.contains('hidden');

                // Now test confirmSfCollect(false)
                let coinsBefore = sunflowerState.coins;
                let collectCallResult = null;
                try {
                  confirmSfCollect(false);
                  collectCallResult = 'success';
                } catch(err) {
                  collectCallResult = err.message;
                }

                return {
                  hasFn,
                  plot1: {
                    unlocked: p.unlocked,
                    plantStatus: p.plantStatus,
                    uncollectedCoins: p.uncollectedCoins,
                    readyToCollect: p.readyToCollect
                  },
                  btnDisabled: btn ? btn.disabled : null,
                  btnClass: btn ? btn.className : null,
                  modalOpen,
                  coinsBefore,
                  coinsAfter: sunflowerState.coins,
                  collectCallResult
                };
              } catch(e) {
                return { error: e.message, stack: e.stack };
              }
            })()
          `,
          returnByValue: true
        });
        console.log('Land collect test:', JSON.stringify(landTest.result.value, null, 2));

        // Test Water Collect
        const waterTest = await send('Runtime.evaluate', {
          expression: `
            (() => {
              try {
                if (typeof navigateSunflowerPage === 'function') navigateSunflowerPage(2);
                const w = sunflowerState.wells[0];
                const btn = document.querySelector('.sf-btn-well-collect');
                const hasCollectWellFn = typeof collectWellBaskets === 'function';
                const hasClickWaterCoin = typeof clickWaterCoin === 'function';

                // Call collectWellBaskets(1)
                const basketsBefore = sunflowerState.baskets;
                let wellResult = null;
                try {
                  collectWellBaskets(1);
                  wellResult = 'success';
                } catch(err) {
                  wellResult = err.message;
                }

                return {
                  hasCollectWellFn,
                  hasClickWaterCoin,
                  well1: {
                    unlocked: w.unlocked,
                    storedBaskets: w.storedBaskets,
                    isProducing: w.isProducing
                  },
                  basketsBefore,
                  basketsAfter: sunflowerState.baskets,
                  wellResult
                };
              } catch(e) {
                return { error: e.message, stack: e.stack };
              }
            })()
          `,
          returnByValue: true
        });
        console.log('Water collect test:', JSON.stringify(waterTest.result.value, null, 2));

        ws.close();
        proc.kill();
      };
    });
  });
}, 2000);
