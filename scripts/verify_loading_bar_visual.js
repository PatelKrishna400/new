const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\patel\\.gemini\\antigravity-ide\\brain\\b71d83e1-6b97-4e11-8cb2-56957b28b9f7';

const proc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=440,950',
  'http://localhost:3000'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9223/json', (res) => {
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
        await new Promise(r => setTimeout(r, 1500));

        await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `
            (() => {
              const splash = document.getElementById('appSplashScreen');
              if (splash) splash.remove();
              if (typeof openSubPage === 'function') openSubPage('sunflower');
            })()
          `
        });
        await new Promise(r => setTimeout(r, 1200));

        // 1. Initial Empty Storage (Green bar filling smoothly)
        const shotNormal = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sunflower_loading_normal.png'), Buffer.from(shotNormal.data, 'base64'));
        console.log('Saved sunflower_loading_normal.png');

        // 2. Set 1 coin in storage (Golden ready bar with candy-cane stripes & active collect)
        await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `
            (() => {
              const p = sunflowerState.plots[0];
              p.uncollectedCoins = 1;
              p.readyToCollect = true;
              p.timer = 45; // 15 seconds into next harvest = 25% loaded
              updateSinglePlotUI(1);
            })()
          `
        });
        await new Promise(r => setTimeout(r, 400));

        const shotStored = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sunflower_loading_stored_coin.png'), Buffer.from(shotStored.data, 'base64'));
        console.log('Saved sunflower_loading_stored_coin.png');

        // Check DOM state
        const storedCheck = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `
            (() => {
              const bar = document.getElementById('sfPlotBarFill-1');
              const text = document.getElementById('sfPlotBarText-1');
              const btn = document.getElementById('sfPlotCollectBtn-1');
              return {
                barWidth: bar ? bar.style.width : null,
                barClass: bar ? bar.className : null,
                text: text ? text.innerText : null,
                btnText: btn ? btn.innerText : null,
                btnClass: btn ? btn.className : null
              };
            })()
          `
        });
        console.log('DOM with 1 coin in storage:\n', JSON.stringify(storedCheck.result.value, null, 2));

        // 3. Click Collect
        await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `collectPlotHarvest(1)`
        });
        await new Promise(r => setTimeout(r, 400));

        const shotAfterCollect = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACTS_DIR, 'sunflower_loading_after_collect.png'), Buffer.from(shotAfterCollect.data, 'base64'));
        console.log('Saved sunflower_loading_after_collect.png');

        const afterCheck = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `
            (() => {
              const bar = document.getElementById('sfPlotBarFill-1');
              const text = document.getElementById('sfPlotBarText-1');
              const btn = document.getElementById('sfPlotCollectBtn-1');
              return {
                coins: sunflowerState.coins,
                uncollected: sunflowerState.plots[0].uncollectedCoins,
                barWidth: bar ? bar.style.width : null,
                barClass: bar ? bar.className : null,
                text: text ? text.innerText : null,
                btnText: btn ? btn.innerText : null
              };
            })()
          `
        });
        console.log('DOM after collect:\n', JSON.stringify(afterCheck.result.value, null, 2));

        proc.kill();
        process.exit(0);
      };
    });
  });
}, 1000);
