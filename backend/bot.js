/**
 * TAP EMPIRE - TELEGRAM MINI APP BOT SERVER
 * Node.js script using simple HTTPS requests to Telegram Bot API
 * 
 * Instructions:
 * 1. Obtain a Bot Token from @BotFather on Telegram.
 * 2. Set TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
 * 3. Set MINI_APP_URL="YOUR_HTTPS_WEB_APP_URL" (e.g. ngrok or Vercel URL)
 * 4. Run `node bot.js`
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '8805652274:AAHUssIHd69pJOSa7PIBpTrxzqILh0mkGMQ';
const WEB_APP_URL = process.env.MINI_APP_URL || process.env.WEB_APP_URL || 'http://localhost:3000';

const https = require('https');

let lastUpdateId = 0;

function apiRequest(method, data = {}) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/${method}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error(`Failed to parse Telegram API response (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function pollUpdates() {
    try {
        const res = await apiRequest('getUpdates', { offset: lastUpdateId + 1, timeout: 20 });
        if (res && res.ok && Array.isArray(res.result) && res.result.length > 0) {
            for (const update of res.result) {
                lastUpdateId = update.update_id;
                if (update.message && update.message.text) {
                    const chatId = update.message.chat.id;
                    const text = update.message.text;

                    if (text.startsWith('/start')) {
                        const isHttps = typeof WEB_APP_URL === 'string' && WEB_APP_URL.startsWith('https://');
                        
                        // Telegram Mini App web_app buttons REQUIRE an https:// URL.
                        // If http:// is used, Telegram returns 400 Bad Request error.
                        const playButton = isHttps
                            ? { text: '👑 PLAY TAP EMPIRE', web_app: { url: WEB_APP_URL } }
                            : { text: '👑 OPEN TAP EMPIRE (Browser)', url: WEB_APP_URL };

                        const sendRes = await apiRequest('sendMessage', {
                            chat_id: chatId,
                            text: '👑 *Welcome to Tap Empire!*\n\nTap to earn coins, level up your hero, spin the lucky wheel, unlock mystery chests, and compete on the global leaderboard!\n\n' +
                                  (isHttps ? '🚀 Tap the button below to launch the Mini App:' : '💡 *Note:* For native in-app Mini App drawer, host via HTTPS (e.g. ngrok/Vercel). Opening browser link:'),
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [playButton]
                                ]
                            }
                        });

                        if (sendRes && sendRes.ok) {
                            console.log(`[Bot] Sent Mini App link to chat ${chatId}`);
                        } else {
                            console.warn(`[Bot Warning] Telegram sendMessage response:`, sendRes);
                        }
                    }
                }
            }
        } else if (res && !res.ok) {
            console.warn('[Bot Error from Telegram API]:', res.description || res);
        }
    } catch (e) {
        console.error('[Bot Error]:', e.message);
    }

    setTimeout(pollUpdates, 1000);
}

if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
    const isHttps = typeof WEB_APP_URL === 'string' && WEB_APP_URL.startsWith('https://');
    console.log(`🤖 Telegram Bot Polling started...`);
    console.log(`🔗 MINI_APP_URL: ${WEB_APP_URL} (${isHttps ? 'HTTPS Valid for WebApp' : 'HTTP - standard browser URL mode'})`);
    if (!isHttps) {
        console.log(`💡 [Tip] To open as Telegram in-app Mini App without 400 error, provide an HTTPS url: MINI_APP_URL="https://your-domain.ngrok-free.app" node bot.js`);
    }
    pollUpdates();
}
