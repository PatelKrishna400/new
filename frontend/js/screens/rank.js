/* ═══════════════════════════════════
   TAP EMPIRE — Leaderboard Screen (Redesigned)
   • Header: 🏆 LEADERBOARD
   • Tabs: 🔥 TODAY | 📅 WEEK | 🌎 ALL TIME
   • Top 3 Podium: #1 Gold (Center), #2 Silver (Left), #3 Bronze (Right)
   • Compact Rank List (#4+)
   • Sticky Current User Card: YOU #4281 12,450,000 Coins
   • Skeleton loading, Empty state, and Error retry states
═══════════════════════════════════ */

'use strict';

let _activeLeaderboardTab = 'today';
let _leaderboardState = 'loading';

function renderRankScreen() {
  const el = document.getElementById('screen-rank');
  if (!el) return;

  el.innerHTML = `
    <div class="leaderboard-screen-container">
      
      <!-- Header -->
      <div class="lb-header-wrap">
        <div class="lb-title">🏆 LEADERBOARD</div>
        
        <!-- Filter Tabs -->
        <div class="lb-filter-tabs">
          <button class="lb-tab-btn ${_activeLeaderboardTab === 'today' ? 'active' : ''}" onclick="switchLeaderboardTab('today')">
            🔥 TODAY
          </button>
          <button class="lb-tab-btn ${_activeLeaderboardTab === 'week' ? 'active' : ''}" onclick="switchLeaderboardTab('week')">
            📅 WEEK
          </button>
          <button class="lb-tab-btn ${_activeLeaderboardTab === 'alltime' ? 'active' : ''}" onclick="switchLeaderboardTab('alltime')">
            🌎 ALL TIME
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="lb-content-area" id="lb-content-area">
        ${renderLeaderboardContent()}
      </div>

      <!-- Sticky Current User Footer Card -->
      ${renderStickyUserCard()}

    </div>`;

  if (_leaderboardState === 'loading') {
    _fetchLeaderboardData();
  }
}

function switchLeaderboardTab(tab) {
  _activeLeaderboardTab = tab;
  _leaderboardState = 'loading';
  renderRankScreen();
}

async function _fetchLeaderboardData() {
  try {
    if (typeof loadLeaderboard === 'function') {
      await loadLeaderboard();
    }
    const list = STATE.leaderboard || [];
    _leaderboardState = list.length > 0 ? 'success' : 'empty';
  } catch (err) {
    console.error('Leaderboard load error:', err);
    _leaderboardState = 'error';
  }
  
  const contentEl = document.getElementById('lb-content-area');
  if (contentEl) {
    contentEl.innerHTML = renderLeaderboardContent();
  }
}

function renderLeaderboardContent() {
  if (_leaderboardState === 'loading') {
    return `
      <div class="lb-skeleton-wrap">
        <div class="lb-podium-skeleton">
          <div class="podium-sk-col p2"></div>
          <div class="podium-sk-col p1"></div>
          <div class="podium-sk-col p3"></div>
        </div>
        ${typeof skeletonRankList === 'function' ? skeletonRankList(6) : ''}
      </div>`;
  }

  if (_leaderboardState === 'error') {
    return `
      <div class="lb-error-state">
        <div class="lb-error-icon">⚠️</div>
        <div class="lb-error-text">Unable to load leaderboard.</div>
        <button class="btn btn-gold btn-retry-lb" onclick="_fetchLeaderboardData()">
          [ RETRY ]
        </button>
      </div>`;
  }

  const list = STATE.leaderboard || [];

  if (_leaderboardState === 'empty' || !list.length) {
    return `
      <div class="lb-empty-state">
        <div class="lb-empty-icon">🏆</div>
        <div class="lb-empty-title">🏆 No ranking data yet.</div>
        <div class="lb-empty-sub">Be the first to tap and claim the top spot!</div>
      </div>`;
  }

  const firstPlace = list[0] || null;
  const secondPlace = list[1] || null;
  const thirdPlace = list[2] || null;
  const restList = list.slice(3, 50);

  return `
    <!-- Top 3 Podium Section -->
    <div class="lb-podium-container">
      
      <!-- Rank #2 Silver (Left) -->
      ${secondPlace ? `
        <div class="podium-card podium-silver anim-podium-rise" style="animation-delay: 0.1s">
          <div class="podium-crown">🥈</div>
          <div class="podium-avatar-wrap">
            <div class="podium-avatar silver-glow">
              ${(secondPlace.firstName || secondPlace.username || 'P2')[0].toUpperCase()}
            </div>
            <div class="podium-rank-tag">#2</div>
          </div>
          <div class="podium-player-name">${esc(secondPlace.firstName || secondPlace.username || 'Player')}</div>
          <div class="podium-player-coins">💰 ${fmt(secondPlace.coins || 0)}</div>
          <div class="podium-block block-silver">2</div>
        </div>` : '<div class="podium-card empty-podium"></div>'}

      <!-- Rank #1 Gold (Center) -->
      ${firstPlace ? `
        <div class="podium-card podium-gold anim-podium-rise" style="animation-delay: 0s">
          <div class="podium-crown">🥇</div>
          <div class="podium-avatar-wrap">
            <div class="podium-avatar gold-glow">
              ${(firstPlace.firstName || firstPlace.username || 'P1')[0].toUpperCase()}
            </div>
            <div class="podium-rank-tag">#1</div>
          </div>
          <div class="podium-player-name">${esc(firstPlace.firstName || firstPlace.username || 'Champion')}</div>
          <div class="podium-player-coins">💰 ${fmt(firstPlace.coins || 0)}</div>
          <div class="podium-block block-gold">1</div>
        </div>` : '<div class="podium-card empty-podium"></div>'}

      <!-- Rank #3 Bronze (Right) -->
      ${thirdPlace ? `
        <div class="podium-card podium-bronze anim-podium-rise" style="animation-delay: 0.2s">
          <div class="podium-crown">🥉</div>
          <div class="podium-avatar-wrap">
            <div class="podium-avatar bronze-glow">
              ${(thirdPlace.firstName || thirdPlace.username || 'P3')[0].toUpperCase()}
            </div>
            <div class="podium-rank-tag">#3</div>
          </div>
          <div class="podium-player-name">${esc(thirdPlace.firstName || thirdPlace.username || 'Player')}</div>
          <div class="podium-player-coins">💰 ${fmt(thirdPlace.coins || 0)}</div>
          <div class="podium-block block-bronze">3</div>
        </div>` : '<div class="podium-card empty-podium"></div>'}

    </div>

    <!-- Ranks #4+ Compact List -->
    <div class="lb-ranks-list anim-fadein">
      ${restList.map(item => {
        const isMe = String(item.id) === String(STATE.tgUser?.id || '');
        const name = esc(item.firstName || item.username || 'Player');

        return `
          <div class="lb-rank-row ${isMe ? 'is-me-row' : ''}">
            <div class="lb-rank-num">#${item.rank}</div>
            <div class="lb-rank-avatar">
              ${name[0].toUpperCase()}
            </div>
            <div class="lb-rank-info">
              <div class="lb-rank-name">${name} ${isMe ? '<span class="you-badge">(YOU)</span>' : ''}</div>
              <div class="lb-rank-level">LVL ${item.level || 1}</div>
            </div>
            <div class="lb-rank-coins">💰 ${fmt(item.coins || 0)}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function renderStickyUserCard() {
  const myId = String(STATE.tgUser?.id || '');
  const list = STATE.leaderboard || [];
  const myEntry = list.find(e => String(e.id) === myId);

  const rankDisplay = myEntry ? `#${myEntry.rank}` : '#4281';
  const coinsDisplay = STATE.coins || (myEntry ? myEntry.coins : 12450000);
  const myName = STATE.tgUser?.first_name || 'YOU';

  return `
    <div class="lb-sticky-user-card">
      <div class="lb-user-left">
        <div class="lb-user-avatar">
          ${(myName[0] || 'Y').toUpperCase()}
        </div>
        <div class="lb-user-details">
          <div class="lb-user-name">YOU</div>
          <div class="lb-user-rank-val">${rankDisplay}</div>
        </div>
      </div>
      <div class="lb-user-right">
        <div class="lb-user-coins-val">💰 ${fmt(coinsDisplay)} Coins</div>
      </div>
    </div>`;
}
