/* ═══════════════════════════════════
   TAP EMPIRE — Profile Screen (Redesigned)
   • Header: 👤 PROFILE
   • Hero: Floating avatar circle, @PlayerName, LEVEL 18, XP progress bar (8,250 / 10,000 XP)
   • 4 Stat Cards: 🔥 Streak (12 Days), 🎯 Missions (48), 🏆 Rank (#4281), 👥 Referrals (24)
   • Achievements: 🏆 First 1K Taps, 🔥 7 Day Streak, 🎁 Chest Master, ⚡ Boost Master
   • Settings: ⚙️ Settings, 🔔 Notifications, 🎨 Graphics Quality, 🔊 Sound
═══════════════════════════════════ */

'use strict';

function renderProfileScreen() {
  const el = document.getElementById('screen-profile');
  if (!el) return;

  const uid = String(STATE.tgUser?.id || '');
  const name = esc(STATE.tgUser?.first_name || 'Player');
  const uname = STATE.tgUser?.username ? `@${esc(STATE.tgUser.username)}` : '@PlayerName';
  const level = STATE.level || 18;
  const currentXp = STATE.xp || 8250;
  const nextXp = STATE.xpNext || 10000;
  const xpPct = Math.min(100, (currentXp / nextXp) * 100).toFixed(1);

  const streakDays = STATE.dailyStreak || 12;
  const completedMissions = STATE.missions ? STATE.missions.filter(m => m.claimed).length : 48;
  const rankVal = STATE.userRank ? `#${STATE.userRank}` : '#4281';
  const referralCount = STATE.referralCount || 24;

  const soundOn = typeof soundEnabled !== 'undefined' ? soundEnabled : true;
  const notifOn = typeof notificationsEnabled !== 'undefined' ? notificationsEnabled : true;

  const achievementsList = [
    { id: 'first_1k', icon: '🏆', title: 'First 1K Taps', unlocked: STATE.totalTaps >= 1000 },
    { id: 'streak_7', icon: '🔥', title: '7 Day Streak', unlocked: streakDays >= 7 },
    { id: 'chest_master', icon: '🎁', title: 'Chest Master', unlocked: true },
    { id: 'boost_master', icon: '⚡', title: 'Boost Master', unlocked: true },
  ];

  el.innerHTML = `
    <div class="screen-scroll profile-page-container">
      
      <!-- ── HEADER ── -->
      <div class="profile-header-wrap">
        <div class="profile-title">👤 PROFILE</div>
      </div>

      <!-- ── HERO PROFILE CARD ── -->
      <div class="profile-hero-card">
        
        <!-- Large Floating Avatar -->
        <div class="profile-avatar-circle avatar-idle-float">
          ${STATE.tgUser?.photo_url
            ? `<img src="${esc(STATE.tgUser.photo_url)}" alt="avatar" />`
            : `<span class="avatar-initial">${(name[0] || 'P').toUpperCase()}</span>`}
        </div>

        <div class="profile-hero-name">${name}</div>
        <div class="profile-hero-username">${uname}</div>
        
        <!-- Level Pill -->
        <div class="profile-level-badge">LEVEL ${level}</div>

        <!-- XP Progress Bar -->
        <div class="profile-xp-card">
          <div class="profile-xp-row">
            <span class="xp-lbl">XP Progress</span>
            <span class="xp-val">${fmt(currentXp)} / ${fmt(nextXp)} XP</span>
          </div>
          <div class="profile-xp-track">
            <div class="profile-xp-fill" style="width: ${xpPct}%"></div>
          </div>
        </div>

      </div>

      <!-- ── 4 STAT CARDS ── -->
      <div class="profile-stats-grid">
        <div class="prof-stat-card">
          <div class="prof-stat-icon">🔥</div>
          <div class="prof-stat-val">${streakDays} Days</div>
          <div class="prof-stat-lbl">Streak</div>
        </div>

        <div class="prof-stat-card">
          <div class="prof-stat-icon">🎯</div>
          <div class="prof-stat-val">${completedMissions}</div>
          <div class="prof-stat-lbl">Missions</div>
        </div>

        <div class="prof-stat-card">
          <div class="prof-stat-icon">🏆</div>
          <div class="prof-stat-val">${rankVal}</div>
          <div class="prof-stat-lbl">Rank</div>
        </div>

        <div class="prof-stat-card">
          <div class="prof-stat-icon">👥</div>
          <div class="prof-stat-val">${referralCount}</div>
          <div class="prof-stat-lbl">Referrals</div>
        </div>
      </div>

      <!-- ── ACHIEVEMENTS SECTION ── -->
      <div class="profile-section-card">
        <div class="section-title" style="margin-bottom:12px">ACHIEVEMENTS</div>
        
        <div class="achieve-grid">
          ${achievementsList.map(a => `
            <div class="achieve-badge-card ${a.unlocked ? 'unlocked anim-badge-pop' : 'locked'}">
              <div class="achieve-icon">${a.icon}</div>
              <div class="achieve-title">${a.title}</div>
              <div class="achieve-status">${a.unlocked ? '✓ Unlocked' : 'Locked'}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── SETTINGS SECTION ── -->
      <div class="profile-section-card">
        <div class="section-title" style="margin-bottom:12px">⚙️ Settings</div>

        <div class="setting-item-row">
          <div class="setting-item-left">
            <div class="setting-item-title">🔔 Notifications</div>
            <div class="setting-item-desc">Daily spin reminders & chest alerts</div>
          </div>
          <button class="toggle-btn ${notifOn ? 'on' : ''}" onclick="toggleNotifications();renderProfileScreen()">
            ${notifOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div class="setting-item-row">
          <div class="setting-item-left">
            <div class="setting-item-title">🎨 Graphics Quality</div>
            <div class="setting-item-desc">Particle FX & performance mode</div>
          </div>
          <div class="perf-row">
            ${['low', 'med', 'high'].map(m => `
              <button class="perf-btn ${STATE.perfMode === m ? 'active' : ''}" onclick="_setPerfMode('${m}')">
                ${m === 'low' ? 'Low' : m === 'med' ? 'Med' : 'High'}
              </button>`).join('')}
          </div>
        </div>

        <div class="setting-item-row" style="border-bottom:none">
          <div class="setting-item-left">
            <div class="setting-item-title">🔊 Sound</div>
            <div class="setting-item-desc">Audio SFX and haptic feedback</div>
          </div>
          <button class="toggle-btn ${soundOn ? 'on' : ''}" onclick="toggleSound();renderProfileScreen()">
            ${soundOn ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <!-- ── FOOTER DISCLAIMER ── -->
      <div class="profile-footer">
        Tap Empire v2.0 &nbsp;·&nbsp; Telegram Mini App<br>
        Game coins are virtual tokens. Stars purchases final.
      </div>

    </div>`;
}

function toggleNotifications() {
  if (typeof notificationsEnabled !== 'undefined') {
    notificationsEnabled = !notificationsEnabled;
  } else {
    window.notificationsEnabled = true;
  }
  showToast(notificationsEnabled ? '🔔 Notifications enabled' : '🔕 Notifications muted');
}

function _setPerfMode(mode) {
  STATE.perfMode = mode;
  if (typeof applyPerfMode === 'function') applyPerfMode(mode);
  renderProfileScreen();
}
