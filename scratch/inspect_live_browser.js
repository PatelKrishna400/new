const http = require('http');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edge = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  'http://localhost:3000/'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = pages.find(p => p.url.includes('localhost:3000'));
  if (!page) {
    console.error('Target page not found');
    edge.kill();
    return;
  }

  console.log('Connecting to page:', page.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Log.enable');

  // Evaluate state initially
  let res = await send('Runtime.evaluate', {
    expression: `({
      hasSunflowerState: typeof sunflowerState !== 'undefined',
      sunflowerState: typeof sunflowerState !== 'undefined' ? {
        plots: sunflowerState.plots.map(p => ({ id: p.id, plantStatus: p.plantStatus, timer: p.timer, lifeTimer: p.lifeTimer })),
        wells: sunflowerState.wells.map(w => ({ id: w.id, isProducing: w.isProducing, timer: w.timer, stored: w.storedBaskets }))
      } : null,
      sfIsLoopRunning: typeof sfIsLoopRunning !== 'undefined' ? sfIsLoopRunning : null
    })`,
    returnByValue: true
  });
  console.log('INITIAL STATE EVAL:', JSON.stringify(res.result.value, null, 2));

  // Switch to sunflower page
  console.log('Navigating to sunflower page...');
  await send('Runtime.evaluate', {
    expression: `switchPage('sunflower')`
  });

  await new Promise(r => setTimeout(r, 1000));

  res = await send('Runtime.evaluate', {
    expression: `({
      hasSunflowerState: typeof sunflowerState !== 'undefined',
      sunflowerState: typeof sunflowerState !== 'undefined' ? {
        plots: sunflowerState.plots.slice(0, 3).map(p => ({ id: p.id, plantStatus: p.plantStatus, timer: p.timer, lifeTimer: p.lifeTimer })),
        wells: sunflowerState.wells.slice(0, 3).map(w => ({ id: w.id, isProducing: w.isProducing, timer: w.timer, stored: w.storedBaskets }))
      } : null,
      sfIsLoopRunning: typeof sfIsLoopRunning !== 'undefined' ? sfIsLoopRunning : null,
      plot1UI: document.getElementById('sfPlotBarText-1') ? document.getElementById('sfPlotBarText-1').innerText : null,
      well1UI: document.getElementById('sfWellTime-1') ? document.getElementById('sfWellTime-1').innerText : null
    })`,
    returnByValue: true
  });
  console.log('AFTER 1 SEC ON SUNFLOWER:', JSON.stringify(res.result.value, null, 2));

  await new Promise(r => setTimeout(r, 2000));

  res = await send('Runtime.evaluate', {
    expression: `({
      plots: sunflowerState ? sunflowerState.plots.slice(0, 3).map(p => ({ id: p.id, timer: p.timer, lifeTimer: p.lifeTimer })) : null,
      wells: sunflowerState ? sunflowerState.wells.slice(0, 3).map(w => ({ id: w.id, timer: w.timer })) : null,
      plot1UI: document.getElementById('sfPlotBarText-1') ? document.getElementById('sfPlotBarText-1').innerText : null,
      well1UI: document.getElementById('sfWellTime-1') ? document.getElementById('sfWellTime-1').innerText : null
    })`,
    returnByValue: true
  });
  console.log('AFTER 3 SEC ON SUNFLOWER:', JSON.stringify(res.result.value, null, 2));

  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  edge.kill();
  process.exit(1);
});
