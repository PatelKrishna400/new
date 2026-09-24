/* ==========================================================================
   PAGE: DEDICATED LEADERBOARD (pages/leaderboard/leaderboard.js)
   - Top 3 Step Podium View (Gold #1 Center, Silver #2 Left, Bronze #3 Right)
   - Top 4 - 100 Scrollable Rankings Roster
   - Profile Image / Avatar, Name, Spinner Event Badge, 👑 Coin Total
   - Dynamic Live Firebase & Local Player Integration
   ========================================================================== */

let currentLeaderboardTab = 'coins'; // 'coins' | 'spin' | 'taps'
let cachedLeaderboardList = [];

// Curated Community Champions Base Roster
const BASE_COMMUNITY_PLAYERS = [
  { name: 'QuantumKing', handle: 'quantum_king', coins: 28920500, spinLevel: 95, taps: 1450200, avatarBg: '#f59e0b', avatarHue: 45 },
  { name: 'CyberWarrior', handle: 'cyber_warrior', coins: 18450000, spinLevel: 78, taps: 980400, avatarBg: '#64748b', avatarHue: 210 },
  { name: 'ViperStrike', handle: 'viper_strike', coins: 12380000, spinLevel: 65, taps: 740100, avatarBg: '#b45309', avatarHue: 25 },
  { name: 'ApexLegend', handle: 'apex_legend', coins: 9540000, spinLevel: 58, taps: 590000, avatarBg: '#0284c7', avatarHue: 195 },
  { name: 'NovaQueen', handle: 'nova_queen', coins: 7820000, spinLevel: 52, taps: 480300, avatarBg: '#ec4899', avatarHue: 330 },
  { name: 'TitanCore', handle: 'titan_core', coins: 6490000, spinLevel: 47, taps: 420100, avatarBg: '#10b981', avatarHue: 160 },
  { name: 'Aarav_Quantum', handle: 'aarav_q', coins: 5890000, spinLevel: 44, taps: 395000, avatarBg: '#8b5cf6', avatarHue: 260 },
  { name: 'ShadowStrike', handle: 'shadow_s', coins: 5120000, spinLevel: 41, taps: 360400, avatarBg: '#f43f5e', avatarHue: 350 },
  { name: 'Priya_Queen', handle: 'priya_tap', coins: 4680000, spinLevel: 39, taps: 320100, avatarBg: '#06b6d4', avatarHue: 180 },
  { name: 'ThunderBolt', handle: 'thunder_b', coins: 4150000, spinLevel: 36, taps: 295000, avatarBg: '#eab308', avatarHue: 50 },
  { name: 'CryptoKnight', handle: 'crypto_k', coins: 3820000, spinLevel: 34, taps: 270400, avatarBg: '#14b8a6', avatarHue: 170 },
  { name: 'PhoenixFlame', handle: 'phoenix_f', coins: 3450000, spinLevel: 32, taps: 250100, avatarBg: '#f97316', avatarHue: 30 },
  { name: 'DragonFury', handle: 'dragon_fury', coins: 3120000, spinLevel: 30, taps: 230500, avatarBg: '#ef4444', avatarHue: 0 },
  { name: 'Rohan_Speed', handle: 'rohan_speed', coins: 2890000, spinLevel: 28, taps: 215000, avatarBg: '#3b82f6', avatarHue: 220 },
  { name: 'CosmicRider', handle: 'cosmic_rider', coins: 2640000, spinLevel: 27, taps: 198000, avatarBg: '#a855f7', avatarHue: 270 },
  { name: 'VortexMaster', handle: 'vortex_m', coins: 2420000, spinLevel: 25, taps: 185000, avatarBg: '#06b6d4', avatarHue: 190 },
  { name: 'SolarFlare', handle: 'solar_flare', coins: 2210000, spinLevel: 24, taps: 172000, avatarBg: '#f59e0b', avatarHue: 40 },
  { name: 'Ananya_Star', handle: 'ananya_star', coins: 2050000, spinLevel: 23, taps: 161000, avatarBg: '#ec4899', avatarHue: 320 },
  { name: 'MatrixNeo', handle: 'matrix_neo', coins: 1890000, spinLevel: 22, taps: 150400, avatarBg: '#10b981', avatarHue: 150 },
  { name: 'HyperDrive', handle: 'hyper_drive', coins: 1750000, spinLevel: 21, taps: 141000, avatarBg: '#6366f1', avatarHue: 240 }
];

// Helper to generate full 100 players dynamically (cached after first build)
function generateFullLeaderboardRoster() {
  if (cachedLeaderboardList && cachedLeaderboardList.length > 0) {
    return cachedLeaderboardList.map(p => ({ ...p }));
  }
  const roster = [...BASE_COMMUNITY_PLAYERS];
  const firstNames = ['Vikram', 'Neha', 'Kabir', 'Maya', 'Arjun', 'Tara', 'Dev', 'Aditi', 'Samir', 'Rhea', 'Karan', 'Isha', 'Reyansh', 'Diya', 'Zayn', 'Sara', 'Kavya', 'Yash', 'Tanvi', 'Neil'];
  const titles = ['Pro', 'Gamer', 'TapKing', 'Reactor', 'Flash', 'Volt', 'Storm', 'Blade', 'Apex', 'Ace', 'Hunter', 'Racer', 'Sonic', 'Ninja', 'Master'];

  let currentCoins = 1650000;
  let currentSpin = 20;
  let currentTaps = 135000;

  for (let i = roster.length + 1; i <= 100; i++) {
    const fn = firstNames[(i * 7) % firstNames.length];
    const ttl = titles[(i * 11) % titles.length];
    const name = `${fn}_${ttl}`;
    
    currentCoins = Math.max(12000, Math.floor(currentCoins * 0.965));
    currentSpin = Math.max(1, Math.floor(currentSpin * 0.985));
    currentTaps = Math.max(800, Math.floor(currentTaps * 0.968));
    const hue = (i * 37) % 360;

    roster.push({
      name: name,
      handle: `${fn.toLowerCase()}_${i}`,
      coins: currentCoins,
      spinLevel: currentSpin,
      taps: currentTaps,
      avatarBg: `hsl(${hue}, 70%, 45%)`,
      avatarHue: hue
    });
  }

  cachedLeaderboardList = roster;
  return roster.map(p => ({ ...p }));
}

// Generate stylized SVG Avatar
function createPlayerAvatarSvg(player, rank = 1) {
  const bg = player.avatarBg || '#0284c7';
  const initial = (player.name || 'P').charAt(0).toUpperCase();

  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%" style="display: block;">
      <defs>
        <linearGradient id="grad_p_${rank}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad_p_${rank})"/>
      <circle cx="50" cy="38" r="18" fill="rgba(255, 255, 255, 0.85)"/>
      <path d="M 22 84 C 24 62, 38 60, 50 60 C 62 60, 76 62, 78 84 Z" fill="rgba(255, 255, 255, 0.75)"/>
      <text x="50" y="44" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="900" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>
  `;
}

function formatLeaderboardNumber(num) {
  const n = Number(num) || 0;
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  }
  if (n >= 10000) {
    return (n / 1000).toFixed(0) + 'K';
  }
  return n.toLocaleString();
}

function switchLeaderboardCategory(tab) {
  currentLeaderboardTab = tab;

  const btnCoins = document.getElementById('lbTabCoins');
  const btnSpin = document.getElementById('lbTabSpin');
  const btnTaps = document.getElementById('lbTabTaps');

  if (btnCoins) btnCoins.classList.toggle('active', tab === 'coins');
  if (btnSpin) btnSpin.classList.toggle('active', tab === 'spin');
  if (btnTaps) btnTaps.classList.toggle('active', tab === 'taps');

  sfx.playTapSound(1);
  renderLeaderboardRoster();
}
window.switchLeaderboardCategory = switchLeaderboardCategory;

function renderLeaderboardRoster() {
  if (typeof gameState !== 'undefined' && gameState.currentTab && gameState.currentTab !== 'leaderboard') {
    return;
  }
  let roster = generateFullLeaderboardRoster();

  // Incorporate real player state
  const myPlayer = (typeof gameState !== 'undefined' && gameState.player) ? gameState.player : { name: 'Player', coins: 0 };
  const myCoins = Number(myPlayer.coins || 0);
  const mySpinLevel = Number((typeof gameState !== 'undefined' && gameState.spinState && gameState.spinState.level) || 1);
  const myTaps = Number((typeof gameState !== 'undefined' && gameState.reactor && gameState.reactor.energyTaps) || 0);

  const meEntry = {
    isMe: true,
    name: myPlayer.name || myPlayer.username || 'Player',
    handle: myPlayer.handle || 'you',
    coins: myCoins,
    spinLevel: mySpinLevel,
    taps: myTaps,
    avatarBg: '#f59e0b',
    avatarHue: 45
  };

  // Sort based on current tab
  if (currentLeaderboardTab === 'spin') {
    roster.sort((a, b) => (b.spinLevel || 0) - (a.spinLevel || 0));
  } else if (currentLeaderboardTab === 'taps') {
    roster.sort((a, b) => (b.taps || 0) - (a.taps || 0));
  } else {
    // Default: coins
    roster.sort((a, b) => (b.coins || 0) - (a.coins || 0));
  }

  // Find user rank
  let myScoreVal = (currentLeaderboardTab === 'spin') ? mySpinLevel : (currentLeaderboardTab === 'taps' ? myTaps : myCoins);
  let myRank = 1;
  for (let i = 0; i < roster.length; i++) {
    const compVal = (currentLeaderboardTab === 'spin') ? roster[i].spinLevel : (currentLeaderboardTab === 'taps' ? roster[i].taps : roster[i].coins);
    if (myScoreVal >= compVal) {
      myRank = i + 1;
      break;
    }
    myRank = i + 2;
  }

  // Insert or highlight user
  if (myRank <= 100) {
    roster.splice(myRank - 1, 0, meEntry);
    roster = roster.slice(0, 100);
  }

  // 1. Render Top 3 Podium
  const rank1 = roster[0] || meEntry;
  const rank2 = roster[1] || meEntry;
  const rank3 = roster[2] || meEntry;

  // Step 1: Gold Champion
  const av1 = document.getElementById('podiumAvatar1');
  const nm1 = document.getElementById('podiumName1');
  const ev1 = document.getElementById('podiumEvent1');
  const sc1 = document.getElementById('podiumScore1');
  if (av1) av1.innerHTML = createPlayerAvatarSvg(rank1, 1);
  if (nm1) nm1.textContent = rank1.name + (rank1.isMe ? ' (You)' : '');
  if (ev1) ev1.textContent = `👑 Event Lv.${rank1.spinLevel || 1}`;
  if (sc1) {
    if (currentLeaderboardTab === 'spin') {
      sc1.textContent = `👑 Lv.${rank1.spinLevel || 1} EVENT`;
    } else if (currentLeaderboardTab === 'taps') {
      sc1.textContent = `⚡ ${formatLeaderboardNumber(rank1.taps)} TAPS`;
    } else {
      sc1.textContent = `👑 ${formatLeaderboardNumber(rank1.coins)} COINS`;
    }
  }

  // Step 2: Silver
  const av2 = document.getElementById('podiumAvatar2');
  const nm2 = document.getElementById('podiumName2');
  const ev2 = document.getElementById('podiumEvent2');
  const sc2 = document.getElementById('podiumScore2');
  if (av2) av2.innerHTML = createPlayerAvatarSvg(rank2, 2);
  if (nm2) nm2.textContent = rank2.name + (rank2.isMe ? ' (You)' : '');
  if (ev2) ev2.textContent = `🎡 Event Lv.${rank2.spinLevel || 1}`;
  if (sc2) {
    if (currentLeaderboardTab === 'spin') {
      sc2.textContent = `👑 Lv.${rank2.spinLevel || 1} EVENT`;
    } else if (currentLeaderboardTab === 'taps') {
      sc2.textContent = `⚡ ${formatLeaderboardNumber(rank2.taps)}`;
    } else {
      sc2.textContent = `👑 ${formatLeaderboardNumber(rank2.coins)}`;
    }
  }

  // Step 3: Bronze
  const av3 = document.getElementById('podiumAvatar3');
  const nm3 = document.getElementById('podiumName3');
  const ev3 = document.getElementById('podiumEvent3');
  const sc3 = document.getElementById('podiumScore3');
  if (av3) av3.innerHTML = createPlayerAvatarSvg(rank3, 3);
  if (nm3) nm3.textContent = rank3.name + (rank3.isMe ? ' (You)' : '');
  if (ev3) ev3.textContent = `🎡 Event Lv.${rank3.spinLevel || 1}`;
  if (sc3) {
    if (currentLeaderboardTab === 'spin') {
      sc3.textContent = `👑 Lv.${rank3.spinLevel || 1} EVENT`;
    } else if (currentLeaderboardTab === 'taps') {
      sc3.textContent = `⚡ ${formatLeaderboardNumber(rank3.taps)}`;
    } else {
      sc3.textContent = `👑 ${formatLeaderboardNumber(rank3.coins)}`;
    }
  }

  // 2. Render Ranks 4 to 100
  const listContainer = document.getElementById('leaderboardListContainer');
  if (listContainer) {
    let listHtml = '';
    const top4to100 = roster.slice(3, 100);

    top4to100.forEach((player, idx) => {
      const rankNum = idx + 4;
      const isTen = rankNum <= 10;
      const isUser = player.isMe;

      let scoreDisplay = `👑 ${formatLeaderboardNumber(player.coins)}`;
      let scoreLabel = 'COINS';
      if (currentLeaderboardTab === 'spin') {
        scoreDisplay = `👑 Lv.${player.spinLevel || 1}`;
        scoreLabel = 'SPIN EVENT';
      } else if (currentLeaderboardTab === 'taps') {
        scoreDisplay = `⚡ ${formatLeaderboardNumber(player.taps)}`;
        scoreLabel = 'TAPS';
      }

      listHtml += `
        <div class="leaderboard-player-row ${isUser ? 'is-current-user' : ''}">
          <div class="row-left">
            <span class="row-rank-badge ${isTen ? 'top-ten' : ''}">#${rankNum}</span>
            <div class="row-avatar">
              ${createPlayerAvatarSvg(player, rankNum)}
            </div>
            <div class="row-info">
              <div class="row-name-wrap">
                <span class="row-name">${escapeLbHtml(player.name)}</span>
                ${isUser ? `<span class="row-you-tag">YOU</span>` : ''}
              </div>
              <span class="row-event-chip">
                <span>🎡</span>
                <span>Event Lv.${player.spinLevel || 1}</span>
              </span>
            </div>
          </div>
          <div class="row-right">
            <span class="row-coins-val">${scoreDisplay}</span>
            <span class="row-coins-label">${scoreLabel}</span>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = listHtml;
  }

  // 3. Render Pinned My Standing Bar
  const myRankPill = document.getElementById('lbMyRankPill');
  const myNameEl = document.getElementById('lbMyName');
  const myEventChip = document.getElementById('lbMyEventChip');
  const myCoinTotal = document.getElementById('lbMyCoinTotal');

  if (myRankPill) myRankPill.textContent = `#${myRank}`;
  if (myNameEl) myNameEl.textContent = meEntry.name;
  if (myEventChip) myEventChip.textContent = `👑 Event Lv.${mySpinLevel}`;
  if (myCoinTotal) {
    if (currentLeaderboardTab === 'spin') {
      myCoinTotal.textContent = `👑 Lv.${mySpinLevel} Event`;
    } else if (currentLeaderboardTab === 'taps') {
      myCoinTotal.textContent = `⚡ ${myTaps.toLocaleString()}`;
    } else {
      myCoinTotal.textContent = `👑 ${myCoins.toLocaleString()}`;
    }
  }
}
window.renderLeaderboardRoster = renderLeaderboardRoster;

function escapeLbHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateLeaderboardUI() {
  renderLeaderboardRoster();
}
window.updateLeaderboardUI = updateLeaderboardUI;

// Auto-render when DOM loads only if leaderboard page is active
document.addEventListener('DOMContentLoaded', () => {
  if (typeof gameState !== 'undefined' && gameState.currentTab === 'leaderboard') {
    renderLeaderboardRoster();
  }
});
