const { spawn } = require('child_process');
const http = require('http');

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
        await new Promise(r => setTimeout(r, 1000));

        const res = await send('Runtime.evaluate', {
          returnByValue: true,
          expression: `
            (() => {
              const p = sunflowerState.plots[0];
              p.uncollectedCoins = 1;
              p.readyToCollect = true;
              updateSinglePlotUI(1);

              const before = {
                coins: sunflowerState.coins,
                uncollected: p.uncollectedCoins,
                ready: p.readyToCollect,
                btnText: document.getElementById('sfPlotCollectBtn-1').innerText,
                barClass: document.getElementById('sfPlotBarFill-1').className,
                barText: document.getElementById('sfPlotBarText-1').innerText
              };

              collectPlotHarvest(1);

              const rightAfter = {
                coins: sunflowerState.coins,
                uncollected: p.uncollectedCoins,
                ready: p.readyToCollect,
                btnText: document.getElementById('sfPlotCollectBtn-1').innerText,
                barClass: document.getElementById('sfPlotBarFill-1').className,
                barText: document.getElementById('sfPlotBarText-1').innerText
              };

              return { before, rightAfter };
            })()
          `
        });
        console.log('Result:', JSON.stringify(res, null, 2));

        proc.kill();
        process.exit(0);
      };
    });
  });
}, 1000);
