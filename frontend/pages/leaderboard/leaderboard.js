/* ==========================================================================
   PAGE: DEDICATED LEADERBOARD (pages/leaderboard/leaderboard.js)
   - Focused strictly on Diamond Win Ranking (Req 20)
   - Real-time Firebase listeners with cleanup to prevent memory leaks (Req 19)
   - Circular Home button integration (Req 18)
   ========================================================================== */

let cachedLeaderboardList = [];
let _lbFirebaseRef = null;
let _lbListenerAttached = false;
let _remoteLeaderboardData = null;

// Generate stylized SVG Avatar
function createPlayerAvatarSvg(player, rank = 1) {
  const bg = player.avatarBg || '#0284c7';
  const initial = (player.name || 'P').charAt(0).toUpperCase();

  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%" style="display: block;">
      <defs>
        <linearGradient id="grad_lb_${rank}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad_lb_${rank})"/>
      <circle cx="50" cy="38" r="18" fill="rgba(255, 255, 255, 0.85)"/>
      <path d="M 22 84 C 24 62, 38 60, 50 60 C 62 60, 76 62, 78 84 Z" fill="rgba(255, 255, 255, 0.75)"/>
      <text x="50" y="44" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="900" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    </svg>
  `;
}

function createEmptyAvatarSvg() {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%" style="display: block; opacity: 0.35;">
      <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#334155" stroke-width="2" stroke-dasharray="4 4"/>
      <circle cx="50" cy="38" r="16" fill="#475569"/>
      <path d="M 26 82 C 28 64, 40 62, 50 62 C 60 62, 72 64, 74 82 Z" fill="#475569"/>
    </svg>
  `;
}

function formatLeaderboardNumber(num) {
  const n = Number(num) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toLocaleString();
}

function renderLeaderboardRoster() {
  // Real User Data Only (Req: demo dummy data removed)
  const myPlayer = (typeof gameState !== 'undefined' && gameState.player) ? gameState.player : { name: 'Player', diamondWins: 0 };
  const myDiamondWins = Number(myPlayer.diamondWins || 0);
  const myUid = (window.firebaseSync && window.firebaseSync.userId) || null;

  const meEntry = {
    isMe: true,
    uid: myUid,
    name: myPlayer.name || myPlayer.username || 'You',
    handle: myPlayer.handle || 'you',
    diamondWins: myDiamondWins,
    diamonds: Number(myPlayer.diamonds || 0),
    avatarBg: '#f59e0b',
    avatarHue: 45
  };

  let roster = [];

  // If real remote Firebase players are loaded, add them
  if (_remoteLeaderboardData && Array.isArray(_remoteLeaderboardData) && _remoteLeaderboardData.length > 0) {
    let matchedMe = false;
    _remoteLeaderboardData.forEach(rp => {
      const isUser = (myUid && rp.uid === myUid) || (rp.name && (rp.name === meEntry.name || rp.name === myPlayer.username));
      if (isUser) matchedMe = true;
      roster.push({
        uid: rp.uid,
        name: rp.name || 'Player',
        handle: rp.handle || (rp.name ? rp.name.toLowerCase() : 'user'),
        diamondWins: isUser ? Math.max(Number(rp.diamondWins || 0), myDiamondWins) : Number(rp.diamondWins || 0),
        diamonds: isUser ? Number(myPlayer.diamonds || 0) : Number(rp.diamonds || 0),
        avatarBg: rp.avatarBg || (isUser ? '#f59e0b' : '#38bdf8'),
        isMe: isUser
      });
    });

    if (!matchedMe) {
      roster.push(meEntry);
    }
  } else {
    // Only real current player
    roster.push(meEntry);
  }

  // Sort strictly by Diamond Wins (Req 20)
  roster.sort((a, b) => (b.diamondWins || 0) - (a.diamondWins || 0));

  // Determine user rank
  const myIndex = roster.findIndex(p => p.isMe);
  const myRank = myIndex >= 0 ? myIndex + 1 : 1;

  // 1. Render Top 3 Step Podium with Real Data
  const rank1 = roster[0] || null;
  const rank2 = roster[1] || null;
  const rank3 = roster[2] || null;

  // Step 1: Gold Champion
  const av1 = document.getElementById('podiumAvatar1');
  const nm1 = document.getElementById('podiumName1');
  const ev1 = document.getElementById('podiumEvent1');
  const sc1 = document.getElementById('podiumScore1');
  if (rank1) {
    if (av1) av1.innerHTML = createPlayerAvatarSvg(rank1, 1);
    if (nm1) nm1.textContent = rank1.name + (rank1.isMe ? ' (You)' : '');
    if (ev1) ev1.textContent = `💎 Season Champion`;
    if (sc1) sc1.textContent = `💎 ${(rank1.diamondWins || 0).toLocaleString()} Wins`;
  } else {
    if (av1) av1.innerHTML = createEmptyAvatarSvg();
    if (nm1) nm1.textContent = '---';
    if (ev1) ev1.textContent = `💎 Champion`;
    if (sc1) sc1.textContent = `💎 0 Wins`;
  }

  // Step 2: Silver
  const av2 = document.getElementById('podiumAvatar2');
  const nm2 = document.getElementById('podiumName2');
  const ev2 = document.getElementById('podiumEvent2');
  const sc2 = document.getElementById('podiumScore2');
  if (rank2) {
    if (av2) av2.innerHTML = createPlayerAvatarSvg(rank2, 2);
    if (nm2) nm2.textContent = rank2.name + (rank2.isMe ? ' (You)' : '');
    if (ev2) ev2.textContent = `🥈 Diamond Master`;
    if (sc2) sc2.textContent = `💎 ${(rank2.diamondWins || 0).toLocaleString()} Wins`;
  } else {
    if (av2) av2.innerHTML = createEmptyAvatarSvg();
    if (nm2) nm2.textContent = '---';
    if (ev2) ev2.textContent = `🥈 Master`;
    if (sc2) sc2.textContent = `💎 0 Wins`;
  }

  // Step 3: Bronze
  const av3 = document.getElementById('podiumAvatar3');
  const nm3 = document.getElementById('podiumName3');
  const ev3 = document.getElementById('podiumEvent3');
  const sc3 = document.getElementById('podiumScore3');
  if (rank3) {
    if (av3) av3.innerHTML = createPlayerAvatarSvg(rank3, 3);
    if (nm3) nm3.textContent = rank3.name + (rank3.isMe ? ' (You)' : '');
    if (ev3) ev3.textContent = `🥉 Diamond Elite`;
    if (sc3) sc3.textContent = `💎 ${(rank3.diamondWins || 0).toLocaleString()} Wins`;
  } else {
    if (av3) av3.innerHTML = createEmptyAvatarSvg();
    if (nm3) nm3.textContent = '---';
    if (ev3) ev3.textContent = `🥉 Elite`;
    if (sc3) sc3.textContent = `💎 0 Wins`;
  }

  // 2. Render Ranks 4+ (Real players only)
  const listContainer = document.getElementById('leaderboardListContainer');
  if (listContainer) {
    const top4to100 = roster.slice(3, 100);

    if (top4to100.length === 0) {
      listContainer.innerHTML = `
        <div class="leaderboard-empty-state">
          <span class="empty-icon">🏆</span>
          <p>No other players yet. Win games and compete with friends to climb the leaderboard!</p>
        </div>
      `;
    } else {
      let listHtml = '';
      top4to100.forEach((player, idx) => {
        const rankNum = idx + 4;
        const isTen = rankNum <= 10;
        const isUser = player.isMe;

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
                  <span>💎</span>
                  <span>Diamond Wins</span>
                </span>
              </div>
            </div>
            <div class="row-right">
              <span class="row-coins-val">💎 ${(player.diamondWins || 0).toLocaleString()}</span>
              <span class="row-coins-label">WINS</span>
            </div>
          </div>
        `;
      });
      listContainer.innerHTML = listHtml;
    }
  }

  // 3. Render Pinned My Standing Bar
  const myRankPill = document.getElementById('lbMyRankPill');
  const myNameEl = document.getElementById('lbMyName');
  const myEventChip = document.getElementById('lbMyEventChip');
  const myCoinTotal = document.getElementById('lbMyCoinTotal');

  if (myRankPill) myRankPill.textContent = `#${myRank}`;
  if (myNameEl) myNameEl.textContent = meEntry.name;
  if (myEventChip) myEventChip.textContent = `💎 Diamond Wins`;
  if (myCoinTotal) myCoinTotal.textContent = `💎 ${myDiamondWins.toLocaleString()} Wins`;
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

// ==========================================================================
// REAL-TIME FIREBASE LEADERBOARD LISTENER (Req 19)
// ==========================================================================
function attachLeaderboardRealtimeListener() {
  if (_lbListenerAttached) return;
  const db = (window.firebaseSync && window.firebaseSync.database) || (typeof firebase !== 'undefined' && firebase.database && firebase.database());
  if (!db) return;

  _lbFirebaseRef = db.ref('leaderboard');
  _lbListenerAttached = true;

  _lbFirebaseRef.limitToLast(100).on('value', (snap) => {
    const val = snap.val();
    if (val && typeof val === 'object') {
      _remoteLeaderboardData = Object.keys(val).map(k => ({
        ...val[k],
        diamondWins: Number(val[k].diamondWins || 0)
      }));
      renderLeaderboardRoster();
    }
  }, (err) => {
    console.warn('Leaderboard realtime error:', err);
  });
}

function cleanupLeaderboardListener() {
  if (_lbFirebaseRef && _lbListenerAttached) {
    _lbFirebaseRef.off();
    _lbFirebaseRef = null;
    _lbListenerAttached = false;
  }
}

window.attachLeaderboardRealtimeListener = attachLeaderboardRealtimeListener;
window.cleanupLeaderboardListener = cleanupLeaderboardListener;

window.updateLeaderboardUI = function() {
  attachLeaderboardRealtimeListener();
  renderLeaderboardRoster();
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gameState !== 'undefined' && gameState.currentTab === 'leaderboard') {
    attachLeaderboardRealtimeListener();
    renderLeaderboardRoster();
  }
});

