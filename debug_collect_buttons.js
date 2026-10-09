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
        await send('Console.enable');

        ws.addEventListener('message', (event) => {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Console.messageAdded' || msg.method === 'Runtime.consoleAPICalled') {
            console.log('BROWSER CONSOLE:', msg.params);
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            console.log('BROWSER EXCEPTION:', JSON.stringify(msg.params, null, 2));
          }
        });

        await new Promise(r => setTimeout(r, 4000));

        await send('Runtime.evaluate', {
          expression: `
            const sp = document.getElementById('appSplashScreen');
            if (sp) sp.remove();
            if (typeof switchPage === 'function') switchPage('sunflower');
          `
        });
        await new Promise(r => setTimeout(r, 1000));

        // Inspect Land Page collect button element and properties
        const landBtnInfo = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const btn = document.getElementById('sfPlotCollectBtn-1');
              const plot = sunflowerState.plots[0];
              return {
                btnExists: !!btn,
                btnDisabled: btn ? btn.disabled : null,
                btnOnclick: btn ? btn.getAttribute('onclick') : null,
                btnOuterHtml: btn ? btn.outerHTML : null,
                plotUncollected: plot ? plot.uncollectedCoins : null,
                plotReady: plot ? plot.readyToCollect : null,
                plotTimer: plot ? plot.timer : null,
                plotStatus: plot ? plot.plantStatus : null
              };
            })()
          `,
          returnByValue: true
        });
        console.log('LAND BTN INFO:', JSON.stringify(landBtnInfo.result.value, null, 2));

        // Switch to Water Tab
        await send('Runtime.evaluate', {
          expression: `if (typeof navigateSunflowerPage === 'function') navigateSunflowerPage(2);`
        });
        await new Promise(r => setTimeout(r, 800));

        // Inspect Water Page collect buttons
        const waterBtnInfo = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const collAllBtn = document.getElementById('sfCollectAllWellsBtn');
              const well1 = sunflowerState.wells[0];
              const wellCollectBtn = document.querySelector('.sf-btn-well-collect');
              const coin = document.getElementById('sfWaterCoin-1');
              return {
                collAllExists: !!collAllBtn,
                collAllOnclick: collAllBtn ? collAllBtn.getAttribute('onclick') : null,
                well1Stored: well1 ? well1.storedBaskets : null,
                well1Timer: well1 ? well1.timer : null,
                wellCollectBtnExists: !!wellCollectBtn,
                wellCollectBtnHtml: wellCollectBtn ? wellCollectBtn.outerHTML : null,
                coinExists: !!coin,
                coinOnclick: coin ? coin.getAttribute('onclick') : null
              };
            })()
          `,
          returnByValue: true
        });
        console.log('WATER BTN INFO:', JSON.stringify(waterBtnInfo.result.value, null, 2));

        ws.close();
        proc.kill();
      };
    });
  });
}, 2000);
