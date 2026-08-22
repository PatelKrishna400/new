/* ==========================================================================
   XP QUEST MOBILE - 100-LEVEL PASS & VIP TIERS ENGINE
   ========================================================================== */

const DEFAULT_STATE = {
    player: {
        name: 'Shadow Blade',
        title: 'Level 1 Novice',
        avatar: '🧙‍♂️',
        level: 1,
        xp: 0,
        maxXp: 500, // LEVEL 1 STARTS AT 500 XP!
        energy: 100,
        maxEnergy: 500,
        coins: 0,
        keys: 0,
        cards: 0,
        tickets: 0,
        stars: 0,
        energyCans: 0,
        silverUnlocked: false, // LOCKED BY DEFAULT!
        silverAdsWatched: 0,
        goldenUnlocked: false, // LOCKED BY DEFAULT!
        goldenAdsWatched: 0,
        claimedFreeLevels: [],
        claimedSilverLevels: [],
        claimedGoldenLevels: []
    },
    seasonEndTime: Date.now() + (25 * 24 * 60 * 60 * 1000), // 25 DAYS TIMER
    soundEnabled: true
};

let gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));

function loadState() {
    try {
        const saved = localStorage.getItem('xp_quest_game_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            gameState = Object.assign({}, DEFAULT_STATE, parsed);
            if (parsed.player) gameState.player = Object.assign({}, DEFAULT_STATE.player, parsed.player);
        }
    } catch (e) {}

    // Synchronize with Tap Empire parent state if available
    try {
        const rawSync = localStorage.getItem('tap_empire_sync_state');
        if (rawSync) {
            const sync = JSON.parse(rawSync);
            if (sync.name) gameState.player.name = sync.name;
            if (sync.level) gameState.player.level = sync.level;
            if (sync.xp !== undefined) gameState.player.xp = sync.xp;
            if (sync.coins !== undefined) gameState.player.coins = sync.coins;
            if (sync.energy !== undefined) gameState.player.energy = sync.energy;
            if (sync.maxEnergy !== undefined) gameState.player.maxEnergy = sync.maxEnergy;
            if (sync.keys !== undefined) gameState.player.keys = sync.keys;
            if (sync.tickets !== undefined) gameState.player.tickets = sync.tickets;
        }
    } catch (e) {}
}

function saveState() {
    try {
        localStorage.setItem('xp_quest_game_state', JSON.stringify(gameState));
        const syncState = {
            name: gameState.player.name,
            level: gameState.player.level,
            xp: gameState.player.xp,
            coins: gameState.player.coins,
            energy: gameState.player.energy,
            maxEnergy: gameState.player.maxEnergy,
            keys: gameState.player.keys,
            tickets: gameState.player.tickets
        };
        localStorage.setItem('tap_empire_sync_state', JSON.stringify(syncState));
    } catch (e) {}
}

// Initial state load
loadState();

// --- TELEGRAM SDK ---
const tg = window.Telegram ? window.Telegram.WebApp : null;

function initTelegramWebApp() {
    if (!tg) return;
    try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#0b101c');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#090d16');
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const user = tg.initDataUnsafe.user;
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
            if (fullName) gameState.player.name = fullName;
        }
    } catch (e) {}
}

function triggerTelegramHaptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
        try {
            if (['success', 'warning', 'error'].includes(type)) {
                tg.HapticFeedback.notificationOccurred(type);
            } else {
                tg.HapticFeedback.impactOccurred(type);
            }
        } catch (e) {}
    }
}

// --- WEB AUDIO SYNTHESIZER ---
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playSound(type) {
    if (!gameState.soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        if (type === 'xp') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'levelup' || type === 'trophy') {
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.08);
                gain.gain.setValueAtTime(0.25, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.35);
            });
        } else if (type === 'claim') {
            [880, 1174.66, 1318.51].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);
                gain.gain.setValueAtTime(0.15, now + i * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.07);
                osc.stop(now + i * 0.07 + 0.2);
            });
        }
    } catch (e) {}
}

// --- LOCAL STORAGE ---
function saveState() {
    try {
        localStorage.setItem('xp_quest_locked_passes_state', JSON.stringify(gameState));
    } catch (e) {}
}

function loadState() {
    try {
        const saved = localStorage.getItem('xp_quest_locked_passes_state');
        if (saved) gameState = JSON.parse(saved);
        if (!gameState.player.maxXp || gameState.player.maxXp < 500) gameState.player.maxXp = 500;
    } catch (e) {}
}

// --- FLOATING TEXT ---
function showFloatingText(text, color = '#E3B81C', event = null) {
    const mainContainer = document.getElementById('app-frame') || document.body;
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.innerText = text;
    floatEl.style.color = color;

    if (event && event.clientX) {
        const rect = mainContainer.getBoundingClientRect();
        floatEl.style.left = `${event.clientX - rect.left - 20}px`;
        floatEl.style.top = `${event.clientY - rect.top - 20}px`;
    } else {
        floatEl.style.left = '50%';
        floatEl.style.top = '30%';
        floatEl.style.transform = 'translateX(-50%)';
    }

    mainContainer.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 1100);
}

// --- REWARD CALCULATOR ---
function getLevelRewards(level) {
    if (level === 101) {
        return {
            free: { energy: 500, coins: 10000, icon: '🥉', isMajor: true, isTrophy: true, name: 'Bronze Trophy' },
            silver: { energy: 1000, keys: 50, cards: 30, icon: '🥈', isMajor: true, isTrophy: true, name: 'Silver Trophy' },
            golden: { energy: 2000, tickets: 50, icon: '🏆', isMajor: true, isTrophy: true, name: 'Golden Trophy' }
        };
    }

    const isFreeMajor = (level === 1 || level % 5 === 0);
    const isSilverMajor = (level === 1 || level % 2 === 0);

    return {
        free: isFreeMajor ? 
            { energy: 50 + (level - 1) * 5, coins: 100 + (level - 1) * 50, icon: '🎁', isMajor: true } : 
            { energy: 10, coins: 0, icon: '⚡', isMajor: false },

        silver: isSilverMajor ? 
            { energy: 100 + (level - 1) * 7, keys: Math.min(50, Math.ceil(level / 2)), cards: Math.min(30, Math.ceil(level / 3.5)), icon: '🎁', isMajor: true } : 
            { energy: 50, keys: 0, cards: 0, icon: '⚡', isMajor: false },

        golden: { 
            energy: 200 + (level - 1) * 10, 
            tickets: Math.min(50, Math.ceil(level / 2)), 
            icon: '🎁', 
            isMajor: true 
        }
    };
}

// --- ENGINE LOGIC ---
function addXP(amount, event = null) {
    gameState.player.xp += amount;
    showFloatingText(`+${amount} XP!`, '#E3B81C', event);
    playSound('xp');
    triggerTelegramHaptic('light');

    if (gameState.player.xp >= gameState.player.maxXp && gameState.player.level < 101) {
        levelUp();
    }

    updateHUD();
    renderPassTable();
    saveState();
}

function levelUp() {
    gameState.player.xp -= gameState.player.maxXp;
    gameState.player.level += 1;
    gameState.player.maxXp = 500 + (gameState.player.level - 1) * 50;

    const titles = ['Novice', 'Adventurer', 'Warrior', 'Champion', 'Hero', 'Legend', 'Guildmaster', 'Godlike', 'Grandmaster'];
    const tIdx = Math.min(Math.floor((gameState.player.level - 1) / 12), titles.length - 1);
    gameState.player.title = `Level ${gameState.player.level} ${titles[tIdx]}`;

    playSound('levelup');
    triggerTelegramHaptic('success');

    const descEl = document.getElementById('level-up-desc');
    const freeEl = document.getElementById('modal-reward-free');
    if (descEl) descEl.innerText = `Level ${gameState.player.level - 1} Completed! Level ${gameState.player.level} Unlocked & Loading!`;
    if (freeEl) freeEl.innerText = `Level ${gameState.player.level} Rewards Unlocked!`;

    const lvlModal = document.getElementById('level-up-modal');
    if (lvlModal) lvlModal.classList.add('active');

    updateHUD();
    renderPassTable();
}

// --- HUD RENDERER ---
function updateHUD() {
    const p = gameState.player;

    const nameEl = document.getElementById('player-name');
    const titleEl = document.getElementById('player-title');
    const avatarEl = document.getElementById('player-avatar');
    if (nameEl) nameEl.innerText = p.name || 'Shadow Blade';
    if (titleEl) titleEl.innerText = p.title || `Level ${p.level} Novice`;
    if (avatarEl) avatarEl.innerText = p.avatar || '🧙‍♂️';

    const coinsEl = document.getElementById('hud-coins');
    const energyEl = document.getElementById('hud-energy');
    const keysEl = document.getElementById('hud-keys');
    const ticketsEl = document.getElementById('hud-tickets');
    if (coinsEl) coinsEl.innerText = (p.coins || 0).toLocaleString();
    if (energyEl) energyEl.innerText = `${p.energy || 0}/${p.maxEnergy || 100}`;
    if (keysEl) keysEl.innerText = p.keys || 0;
    if (ticketsEl) ticketsEl.innerText = p.tickets || 0;

    const currPct = Math.min(100, Math.floor((p.xp / p.maxXp) * 100));
    const barCurrEl = document.getElementById('xp-bar-curr-text');
    const barValEl = document.getElementById('xp-bar-val-text');
    const barFillEl = document.getElementById('xp-bar-fill');
    if (barCurrEl) barCurrEl.innerText = `Level ${p.level} Progress`;
    if (barValEl) barValEl.innerText = `${p.xp} / ${p.maxXp} XP (${currPct}%)`;
    if (barFillEl) barFillEl.style.width = `${currPct}%`;

    const silverAdsEl = document.getElementById('silver-ads-count');
    const goldenAdsEl = document.getElementById('golden-ads-count');
    if (silverAdsEl) silverAdsEl.innerText = p.silverAdsWatched || 0;
    if (goldenAdsEl) goldenAdsEl.innerText = p.goldenAdsWatched || 0;

    const thSilver = document.getElementById('th-silver-header');
    const thGolden = document.getElementById('th-golden-header');
    if (thSilver) thSilver.innerHTML = p.silverUnlocked ? `🎁 SILVER PASS ✅` : `🥈 SILVER PASS`;
    if (thGolden) thGolden.innerHTML = p.goldenUnlocked ? `🎁 GOLDEN PASS ✅` : `👑 GOLDEN PASS`;

    const statusSilv = document.getElementById('status-silver-txt');
    const statusGold = document.getElementById('status-golden-txt');
    if (statusSilv) statusSilv.innerText = p.silverUnlocked ? '✅ UNLOCKED' : `🔒 LOCKED (${p.silverAdsWatched || 0}/50 ADS)`;
    if (statusGold) statusGold.innerText = p.goldenUnlocked ? '✅ UNLOCKED' : `🔒 LOCKED (${p.goldenAdsWatched || 0}/100 ADS)`;
}

// --- 25-DAY SEASON COUNTDOWN TIMER ---
function startSeasonCountdown() {
    function updateTimer() {
        const now = Date.now();
        const diff = Math.max(0, gameState.seasonEndTime - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        const timerEl = document.getElementById('season-countdown-timer');
        if (timerEl) {
            timerEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${days}d ${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        }
    }
    updateTimer();
    setInterval(updateTimer, 1000);
}

// --- RENDER PASS TABLE WITH LOCKED PASS CONTROL ---
function renderPassTable() {
    const tbody = document.getElementById('pass-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let lvl = 1; lvl <= 101; lvl++) {
        const rewards = getLevelRewards(lvl);
        const isCurrent = lvl === gameState.player.level;
        const isCompleted = lvl < gameState.player.level;
        const isUnlocked = lvl <= gameState.player.level;
        const isFinaleRow = lvl === 101;
        const isMilestoneRow = (lvl === 1 || lvl % 5 === 0);

        const isFreeClaimed = gameState.player.claimedFreeLevels.includes(lvl);
        const isSilverClaimed = gameState.player.claimedSilverLevels.includes(lvl);
        const isGoldenClaimed = gameState.player.claimedGoldenLevels.includes(lvl);

        const isSilverItemUnlocked = gameState.player.silverUnlocked && isUnlocked;
        const isGoldenItemUnlocked = gameState.player.goldenUnlocked && isUnlocked;

        let strokeOffset = 125;
        let lineFillPct = 0;
        if (lvl < gameState.player.level) {
            strokeOffset = 0;
            lineFillPct = 100;
        } else if (lvl === gameState.player.level) {
            const pct = Math.min(100, Math.floor((gameState.player.xp / gameState.player.maxXp) * 100));
            strokeOffset = 125 - (pct / 100) * 125;
            lineFillPct = pct;
        }

        const tr = document.createElement('tr');
        if (isCurrent) tr.className = 'current-row level-loading-active';
        if (isCompleted) tr.className += ' level-completed';
        if (!isUnlocked) tr.className += ' level-dark-locked';
        if (isMilestoneRow) tr.className += ' milestone-row';
        if (isFinaleRow) tr.className += ' finale-all-completed-row';

        tr.innerHTML = `
            <!-- COLUMN 1: VERTICAL XP LINE & CIRCULAR YELLOW XP BAR -->
            <td class="col-xp-cell">
                <div class="xp-table-cell">
                    <div class="xp-continuous-bar-bg"></div>
                    <div class="xp-continuous-bar-fill" style="height: ${lineFillPct}%;"></div>

                    <div class="xp-circle-container ${isFinaleRow ? 'finale-circle' : ''} ${isCurrent ? 'loading-ring' : ''}">
                        ${isFinaleRow ? `
                            <div class="season-badge-wrapper">
                                <span class="season-badge-emoji">👑</span>
                                <span class="season-badge-text">SEASON 1</span>
                            </div>
                        ` : `
                            <svg class="xp-circle-svg" viewBox="0 0 48 48">
                                <defs>
                                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="#E3B81C" />
                                        <stop offset="100%" stop-color="#f59e0b" />
                                    </linearGradient>
                                </defs>
                                <circle class="xp-circle-bg" cx="24" cy="24" r="20"></circle>
                                <circle class="xp-circle-bar" cx="24" cy="24" r="20" style="stroke-dashoffset: ${strokeOffset};"></circle>
                            </svg>
                            <span class="xp-circle-num">${lvl}</span>
                        `}
                    </div>
                </div>
            </td>

            <!-- COLUMN 2: FREE PASS -->
            <td class="col-free-cell">
                <div class="table-gift-card free gift-card-clickable ${isFreeClaimed ? 'claimed' : (isUnlocked ? 'claimable' : 'locked dark-locked')} ${rewards.free.isTrophy ? 'trophy-card bronze-trophy' : (!rewards.free.isMajor ? 'minor-energy-card' : '')}" data-type="free" data-lvl="${lvl}">
                    <div class="gift-icon">${rewards.free.icon}</div>
                </div>
            </td>

            <!-- COLUMN 3: SILVER PASS (LOCKED SHADING UNTIL BOUGHT) -->
            <td class="col-silver-cell">
                <div class="table-gift-card silver gift-card-clickable ${isSilverClaimed ? 'claimed' : (isSilverItemUnlocked ? 'claimable' : 'locked dark-locked')} ${rewards.silver.isTrophy ? 'trophy-card silver-trophy' : (!rewards.silver.isMajor ? 'minor-energy-card' : '')}" data-type="silver" data-lvl="${lvl}">
                    <div class="gift-icon ${rewards.silver.isMajor && !rewards.silver.isTrophy ? 'silver-gift-icon' : ''}">${rewards.silver.icon}</div>
                </div>
            </td>

            <!-- COLUMN 4: GOLDEN PASS (LOCKED SHADING UNTIL BOUGHT) -->
            <td class="col-golden-cell">
                <div class="table-gift-card golden gift-card-clickable ${isGoldenClaimed ? 'claimed' : (isGoldenItemUnlocked ? 'claimable' : 'locked dark-locked')} ${rewards.golden.isTrophy ? 'trophy-card golden-trophy' : ''}" data-type="golden" data-lvl="${lvl}">
                    <div class="gift-icon ${!rewards.golden.isTrophy ? 'golden-gift-icon' : ''}">${rewards.golden.icon}</div>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    }

    // Attach Click Handlers to Gift Emoji Bubbles
    document.querySelectorAll('.gift-card-clickable').forEach(card => {
        card.addEventListener('click', (e) => {
            const type = card.getAttribute('data-type');
            const lvl = parseInt(card.getAttribute('data-lvl'));
            const rewards = getLevelRewards(lvl);
            const rewardItem = rewards[type];

            if (type === 'silver') {
                if (!gameState.player.silverUnlocked) {
                    openSilverPassModal();
                    return;
                }
                if (lvl > gameState.player.level) {
                    showFloatingText(`Complete Level ${gameState.player.level} first!`, '#f43f5e', e);
                    addXP(100, e);
                    return;
                }
                if (lvl <= gameState.player.level && !gameState.player.claimedSilverLevels.includes(lvl)) {
                    if (rewardItem.isMajor) {
                        claimSilverReward(lvl, e);
                    } else {
                        runAdToClaimSilverEnergy(lvl, e);
                    }
                }
            } else if (type === 'golden') {
                if (!gameState.player.goldenUnlocked) {
                    openGoldenPassModal();
                    return;
                }
                if (lvl > gameState.player.level) {
                    showFloatingText(`Complete Level ${gameState.player.level} first!`, '#f43f5e', e);
                    addXP(100, e);
                    return;
                }
                if (lvl <= gameState.player.level && !gameState.player.claimedGoldenLevels.includes(lvl)) {
                    claimGoldenReward(lvl, e);
                }
            } else if (type === 'free') {
                if (lvl > gameState.player.level) {
                    showFloatingText(`Complete Level ${gameState.player.level} first!`, '#f43f5e', e);
                    addXP(100, e);
                    return;
                }
                if (lvl <= gameState.player.level && !gameState.player.claimedFreeLevels.includes(lvl)) {
                    if (rewardItem.isMajor) {
                        claimFreeReward(lvl, e);
                    } else {
                        runAdToClaimFreeEnergy(lvl, e);
                    }
                }
            }
        });
    });
}

function openSilverPassModal() {
    const m = document.getElementById('modal-silver-pass');
    if (m) m.classList.add('active');
}

function openGoldenPassModal() {
    const m = document.getElementById('modal-golden-pass');
    if (m) m.classList.add('active');
}

// --- RUN AD BEFORE CLAIMING FREE ⚡ ENERGY (+10) ---
function runAdToClaimFreeEnergy(lvl, event) {
    showFloatingText('🎬 Watching Ad (3s)...', '#E3B81C', event);
    playSound('xp');

    setTimeout(() => {
        if (!gameState.player.claimedFreeLevels.includes(lvl)) {
            gameState.player.claimedFreeLevels.push(lvl);
            gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + 10);
        }
        playSound('claim');
        triggerTelegramHaptic('success');
        showFloatingText('⚡ +10 Energy Claimed!', '#10b981', event);

        updateHUD();
        renderPassTable();
        saveState();
    }, 2000);
}

// --- RUN AD BEFORE CLAIMING SILVER ⚡ ENERGY (+50 ENERGY) ---
function runAdToClaimSilverEnergy(lvl, event) {
    showFloatingText('🎬 Watching Ad (3s)...', '#C0C0C0', event);
    playSound('xp');

    setTimeout(() => {
        if (!gameState.player.claimedSilverLevels.includes(lvl)) {
            gameState.player.claimedSilverLevels.push(lvl);
            gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + 50);
        }
        playSound('claim');
        triggerTelegramHaptic('success');
        showFloatingText('⚡ +50 Energy Claimed!', '#10b981', event);

        updateHUD();
        renderPassTable();
        saveState();
    }, 2000);
}

function claimFreeReward(lvl, event) {
    if (gameState.player.claimedFreeLevels.includes(lvl)) return;
    const rewards = getLevelRewards(lvl);
    gameState.player.claimedFreeLevels.push(lvl);

    gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + rewards.free.energy);
    if (rewards.free.coins) gameState.player.coins += rewards.free.coins;

    playSound(rewards.free.isTrophy ? 'trophy' : 'claim');
    triggerTelegramHaptic('success');
    showFloatingText(rewards.free.isTrophy ? `🥉 BRONZE TROPHY UNLOCKED!` : `🎁 +${rewards.free.energy} Energy & Coins!`, '#f59e0b', event);

    updateHUD();
    renderPassTable();
    saveState();
}

function claimSilverReward(lvl, event) {
    if (gameState.player.claimedSilverLevels.includes(lvl)) return;
    const rewards = getLevelRewards(lvl);
    gameState.player.claimedSilverLevels.push(lvl);

    gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + rewards.silver.energy);
    if (rewards.silver.keys) gameState.player.keys += rewards.silver.keys;
    if (rewards.silver.cards) gameState.player.cards += rewards.silver.cards;

    playSound(rewards.silver.isTrophy ? 'trophy' : 'claim');
    triggerTelegramHaptic('success');
    showFloatingText(rewards.silver.isTrophy ? `🥈 SILVER TROPHY UNLOCKED!` : `🎁 Silver Pass Gift Claimed!`, '#C0C0C0', event);

    updateHUD();
    renderPassTable();
    saveState();
}

function claimGoldenReward(lvl, event) {
    if (gameState.player.claimedGoldenLevels.includes(lvl)) return;
    const rewards = getLevelRewards(lvl);
    gameState.player.claimedGoldenLevels.push(lvl);

    gameState.player.energy = Math.min(gameState.player.maxEnergy, gameState.player.energy + rewards.golden.energy);
    if (rewards.golden.tickets) gameState.player.tickets += rewards.golden.tickets;

    playSound(rewards.golden.isTrophy ? 'trophy' : 'claim');
    triggerTelegramHaptic('success');
    showFloatingText(rewards.golden.isTrophy ? `🏆 GOLDEN TROPHY UNLOCKED!` : `🎁 Golden Pass Gift Claimed!`, '#E3B81C', event);

    updateHUD();
    renderPassTable();
    saveState();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTelegramWebApp();
    startSeasonCountdown();

    const thSilver = document.getElementById('th-silver-header');
    if (thSilver) thSilver.addEventListener('click', () => openSilverPassModal());

    const thGolden = document.getElementById('th-golden-header');
    if (thGolden) thGolden.addEventListener('click', () => openGoldenPassModal());

    // Silver Stars Unlock
    const btnSilverStars = document.getElementById('btn-buy-silver-stars');
    if (btnSilverStars) {
        btnSilverStars.addEventListener('click', (e) => {
            if (tg && tg.openInvoice) {
                tg.openInvoice('https://t.me/invoice/silver_pass_500_stars', (status) => {
                    if (status === 'paid' || status === 'completed') unlockSilverPass(e);
                });
            } else {
                unlockSilverPass(e);
            }
        });
    }

    // Silver Ads Unlock via Rewarded Interstitial SDK (show_11629417)
    const btnSilverAds = document.getElementById('btn-buy-silver-ads');
    if (btnSilverAds) {
        btnSilverAds.addEventListener('click', (e) => {
            const triggerAd = typeof show_11629417 === 'function' ? show_11629417 : (typeof show_11363275 === 'function' ? show_11363275 : null);
            if (triggerAd) {
                btnSilverAds.disabled = true;
                triggerAd().then(() => {
                    btnSilverAds.disabled = false;
                    gameState.player.silverAdsWatched = (gameState.player.silverAdsWatched || 0) + 1;
                    showFloatingText(`Silver Ad Watched (${gameState.player.silverAdsWatched}/50)! 🎉`, '#06b6d4', e);
                    playSound('claim');
                    triggerTelegramHaptic('success');

                    if (gameState.player.silverAdsWatched >= 50) {
                        unlockSilverPass(e);
                    } else {
                        updateHUD();
                        saveState();
                    }
                }).catch(err => {
                    console.warn('Ad closed or error:', err);
                    btnSilverAds.disabled = false;
                });
            } else {
                btnSilverAds.disabled = true;
                setTimeout(() => {
                    btnSilverAds.disabled = false;
                    gameState.player.silverAdsWatched = (gameState.player.silverAdsWatched || 0) + 1;
                    showFloatingText(`Silver Ad Watched (${gameState.player.silverAdsWatched}/50)! 🎉`, '#06b6d4', e);
                    playSound('claim');
                    triggerTelegramHaptic('light');

                    if (gameState.player.silverAdsWatched >= 50) {
                        unlockSilverPass(e);
                    } else {
                        updateHUD();
                        saveState();
                    }
                }, 1500);
            }
        });
    }

    function unlockSilverPass(event) {
        gameState.player.silverUnlocked = true;
        playSound('claim');
        triggerTelegramHaptic('success');
        showFloatingText('Silver Pass Unlocked! 🎉', '#C0C0C0', event);
        const m = document.getElementById('modal-silver-pass');
        if (m) m.classList.remove('active');
        updateHUD();
        renderPassTable();
        saveState();
    }

    // Golden Stars Unlock
    const btnGoldenStars = document.getElementById('btn-buy-golden-stars');
    if (btnGoldenStars) {
        btnGoldenStars.addEventListener('click', (e) => {
            if (tg && tg.openInvoice) {
                tg.openInvoice('https://t.me/invoice/golden_pass_1000_stars', (status) => {
                    if (status === 'paid' || status === 'completed') unlockGoldenPass(e);
                });
            } else {
                unlockGoldenPass(e);
            }
        });
    }

    // Golden Ads Unlock via Rewarded Interstitial SDK (show_11629417)
    const btnGoldenAds = document.getElementById('btn-buy-golden-ads');
    if (btnGoldenAds) {
        btnGoldenAds.addEventListener('click', (e) => {
            const triggerAd = typeof show_11629417 === 'function' ? show_11629417 : (typeof show_11363275 === 'function' ? show_11363275 : null);
            if (triggerAd) {
                btnGoldenAds.disabled = true;
                triggerAd().then(() => {
                    btnGoldenAds.disabled = false;
                    gameState.player.goldenAdsWatched = (gameState.player.goldenAdsWatched || 0) + 1;
                    showFloatingText(`Golden Ad Watched (${gameState.player.goldenAdsWatched}/100)! 👑`, '#E3B81C', e);
                    playSound('claim');
                    triggerTelegramHaptic('success');

                    if (gameState.player.goldenAdsWatched >= 100) {
                        unlockGoldenPass(e);
                    } else {
                        updateHUD();
                        saveState();
                    }
                }).catch(err => {
                    console.warn('Ad closed or error:', err);
                    btnGoldenAds.disabled = false;
                });
            } else {
                btnGoldenAds.disabled = true;
                setTimeout(() => {
                    btnGoldenAds.disabled = false;
                    gameState.player.goldenAdsWatched = (gameState.player.goldenAdsWatched || 0) + 1;
                    showFloatingText(`Golden Ad Watched (${gameState.player.goldenAdsWatched}/100)! 👑`, '#E3B81C', e);
                    playSound('claim');
                    triggerTelegramHaptic('light');

                    if (gameState.player.goldenAdsWatched >= 100) {
                        unlockGoldenPass(e);
                    } else {
                        updateHUD();
                        saveState();
                    }
                }, 1500);
            }
        });
    }

    function unlockGoldenPass(event) {
        gameState.player.goldenUnlocked = true;
        playSound('claim');
        triggerTelegramHaptic('success');
        showFloatingText('Golden Pass Unlocked! 👑', '#E3B81C', event);
        const m = document.getElementById('modal-golden-pass');
        if (m) m.classList.remove('active');
        updateHUD();
        renderPassTable();
        saveState();
    }

    const btnCloseSilver = document.getElementById('btn-close-silver-modal');
    if (btnCloseSilver) {
        btnCloseSilver.addEventListener('click', () => {
            const m = document.getElementById('modal-silver-pass');
            if (m) m.classList.remove('active');
        });
    }

    const btnCloseGolden = document.getElementById('btn-close-golden-modal');
    if (btnCloseGolden) {
        btnCloseGolden.addEventListener('click', () => {
            const m = document.getElementById('modal-golden-pass');
            if (m) m.classList.remove('active');
        });
    }

    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            const m = document.getElementById('level-up-modal');
            if (m) m.classList.remove('active');
        });
    }

    updateHUD();
    renderPassTable();
});
