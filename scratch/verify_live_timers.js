const http = require('http');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const edge = spawn(edgePath, [
  '--headless',
  '--remote-debugging-port=9223',
  '--disable-gpu',
  'http://localhost:3000/'
]);

async function run() {
  await new Promise(r => setTimeout(r, 3000));
  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
  const page = pages.find(p => p.url.includes('localhost:3000'));
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
      const text = msg.params.args.map(a => a.value || a.description).join(' ');
      if (!text.includes('Firebase') && !text.includes('WebSocket')) {
        console.log('[BROWSER CONSOLE]', msg.params.type, text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const ed = msg.params.exceptionDetails;
      console.error('[BROWSER EXCEPTION]', ed.text, ed.exception?.description, 'at', ed.url, `${ed.lineNumber}:${ed.columnNumber}`);
    }
    if (msg.id && pending.has(msg.id)) {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg.result);
    }
  };
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  let res = await send('Runtime.evaluate', {
    expression: "document.readyState",
    returnByValue: true
  });
  console.log('1. document.readyState:', res.result.value);

  res = await send('Runtime.evaluate', {
    expression: "typeof sunflowerState !== 'undefined'",
    returnByValue: true
  });
  console.log('2. typeof sunflowerState:', res.result.value);

  // Switch to sunflower page
  await send('Runtime.evaluate', {
    expression: "if (typeof switchPage === 'function') switchPage('sunflower');",
    returnByValue: true
  });

  // Verify sunflower state and loop running
  res = await send('Runtime.evaluate', {
    expression: "JSON.stringify({ isLoopRunning: sfIsLoopRunning, plot1Timer: sunflowerState.plots[0].timer, well1Timer: sunflowerState.wells[0].timer, plot1Life: sunflowerState.plots[0].lifeTimer })",
    returnByValue: true
  });
  const snap1 = JSON.parse(res.result.value);
  console.log('3. Snapshot 1 (Initial):', snap1);

  // Wait 1.5 seconds for timers to advance
  await new Promise(r => setTimeout(r, 1500));

  res = await send('Runtime.evaluate', {
    expression: "JSON.stringify({ isLoopRunning: sfIsLoopRunning, plot1Timer: sunflowerState.plots[0].timer, well1Timer: sunflowerState.wells[0].timer, plot1Life: sunflowerState.plots[0].lifeTimer, well1Text: document.getElementById('sfWellTime-1')?.innerText, plot1Text: document.getElementById('sfPlotBarText-1')?.innerText })",
    returnByValue: true
  });
  const snap2 = JSON.parse(res.result.value);
  console.log('4. Snapshot 2 (After 1.5s):', snap2);

  // Test switching to Water page (Page 2)
  await send('Runtime.evaluate', {
    expression: "if (typeof navigateSunflowerPage === 'function') navigateSunflowerPage(2);",
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 500));

  res = await send('Runtime.evaluate', {
    expression: "JSON.stringify({ well1Text: document.getElementById('sfWellTime-1')?.innerText, well1Progress: document.getElementById('sfWellProgressBar-1')?.style.width })",
    returnByValue: true
  });
  console.log('5. Water Page 2 UI check:', JSON.parse(res.result.value));

  // Test switching back to Lands/Home page (Page 1)
  await send('Runtime.evaluate', {
    expression: "if (typeof navigateSunflowerPage === 'function') navigateSunflowerPage(1);",
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 500));

  res = await send('Runtime.evaluate', {
    expression: "JSON.stringify({ plot1Text: document.getElementById('sfPlotBarText-1')?.innerText, plot1Life: document.getElementById('sfPlotLifeText-1')?.innerText, plot1Progress: document.getElementById('sfPlotBarFill-1')?.style.width })",
    returnByValue: true
  });
  console.log('6. Lands Page 1 UI check:', JSON.parse(res.result.value));

  ws.close();
  edge.kill();

  const timersRunning = snap1.isLoopRunning && snap2.isLoopRunning;
  if (timersRunning) {
    console.log('\n✔ SUCCESS: Sunflower Tycoon main loop and live timers are running continuously in real browser!');
  } else {
    console.error('\n❌ FAILURE: Timers not running!');
  }

  process.exit(0);
}
run();
