/* ═══════════════════════════════════
   TAP EMPIRE — Live Events Screen
   • Header: 🔥 LIVE EVENTS
   • Hero Poster: 🔥 WEEKEND TAP RUSH (2× TAP POWER | 12:42:31 countdown | [ PLAY EVENT ])
   • Event Cards:
     - 🎁 CHEST FEST (Open 5 chests | 10,000 Coins)
     - ⚡ ENERGY FESTIVAL (Use 1,000 Energy | Rare Boost)
     - 🏆 WEEKLY CHAMPIONSHIP (Reach top 100 | Exclusive Badge)
   • Local countdown timer driven by server end timestamp
   • Completed event state: 🎉 EVENT COMPLETE
═══════════════════════════════════ */

'use strict';

let _eventCountdownInterval = null;

const EVENT_DEFS = {
  hero: {
    id: 'weekend_rush',
    title: 'WEEKEND TAP RUSH',
    desc: '2× TAP POWER ON ALL TAPS',
    icon: '🔥',
    target: 10000,
    progress: 7500,
    rewardText: '2× TAP POWER BOOST',
    endTimestamp: Date.now() + (12 * 3600 + 42 * 60 + 31) * 1000,
    completed: false
  },
  cards: [
    {
      id: 'chest_fest',
      title: 'CHEST FEST',
      desc: 'Open 5 chests',
      icon: '🎁',
      target: 5,
      progress: 3,
      rewardText: '💰 10,000 Coins',
      completed: false
    },
    {
      id: 'energy_fest',
      title: 'ENERGY FESTIVAL',
      desc: 'Use 1,000 Energy',
      icon: '⚡',
      target: 1000,
      progress: 650,
      rewardText: '🚀 Rare Boost',
      completed: false
    },
    {
      id: 'championship',
      title: 'WEEKLY CHAMPIONSHIP',
      desc: 'Reach top 100 on Leaderboard',
      icon: '🏆',
      target: 100,
      progress: 4281,
      rewardText: '👑 Exclusive Badge',
      actionType: 'rank',
      completed: false
    }
  ]
};

function renderEventsScreen() {
  const el = document.getElementById('screen-events');
  if (!el) return;

  const hero = EVENT_DEFS.hero;
  const cards = EVENT_DEFS.cards;
  const remainingMs = Math.max(0, hero.endTimestamp - Date.now());
  const heroPct = Math.min(100, (hero.progress / hero.target) * 100).toFixed(1);

  el.innerHTML = `
    <div class="screen-scroll events-page-container">
      
      <!-- ── HEADER ── -->
      <div class="events-header-wrap">
        <div class="events-title">🔥 LIVE EVENTS</div>
      </div>

      <!-- ── HERO EVENT POSTER ── -->
      <div class="hero-event-poster">
        <!-- Subtle particle overlay effect -->
        <div class="hero-poster-particles"></div>

        <div class="hero-poster-badge">${hero.completed ? '🎉 EVENT COMPLETE' : '🔥 LIMITED TIME'}</div>

        <div class="hero-poster-content">
          <div class="hero-poster-icon flame-idle-pulse">${hero.icon}</div>
          <div class="hero-poster-title">${hero.title}</div>
          <div class="hero-poster-desc">${hero.desc}</div>

          <!-- Progress bar -->
          <div class="hero-poster-prog-wrap">
            <div class="hero-poster-prog-row">
              <span class="hero-prog-lbl">Progress</span>
              <span class="hero-prog-val">${fmt(hero.progress)} / ${fmt(hero.target)}</span>
            </div>
            <div class="hero-poster-prog-track">
              <div class="hero-poster-prog-fill" style="width: ${heroPct}%"></div>
            </div>
          </div>

          <!-- Countdown timer -->
          <div class="hero-poster-timer-row">
            <span class="timer-lbl">Time remaining:</span>
            <span class="timer-val" id="hero-event-timer">${_formatEventTimer(remainingMs)}</span>
          </div>

          <!-- Action Button -->
          <button class="btn btn-gold btn-hero-event" onclick="handleHeroEventAction('${hero.id}')">
            ${hero.completed ? '🎉 CLAIM EVENT REWARD' : '🔥 PLAY EVENT'}
          </button>
        </div>
      </div>

      <!-- ── EVENT CARDS LIST ── -->
      <div class="events-cards-list">
        <div class="section-title" style="margin-bottom:8px">Special Challenges</div>

        ${cards.map(c => {
          const pct = Math.min(100, (c.progress / c.target) * 100).toFixed(1);
          const isDone = c.completed;

          return `
            <div class="event-card-item ${isDone ? 'completed-card' : ''}">
              <div class="event-card-left">
                <div class="event-card-icon">${c.icon}</div>
                <div class="event-card-details">
                  <div class="event-card-title">${c.title}</div>
                  <div class="event-card-desc">${c.desc}</div>
                  
                  <div class="event-card-prog-wrap">
                    <div class="event-card-prog-fill" style="width: ${pct}%"></div>
                  </div>
                  <div class="event-card-sub">${fmt(c.progress)} / ${fmt(c.target)}</div>
                </div>
              </div>

              <div class="event-card-right">
                <div class="event-card-reward">${c.rewardText}</div>
                ${isDone ? `
                  <div class="event-done-badge">✓ DONE</div>` :
                  c.actionType === 'rank' ? `
                  <button class="btn btn-outline btn-event-action" onclick="switchScreen('rank')">
                    GO TO RANK
                  </button>` : `
                  <button class="btn btn-gold btn-event-action" onclick="handleEventCardClaim(event, '${c.id}')">
                    CLAIM
                  </button>`
                }
              </div>
            </div>`;
        }).join('')}
      </div>

    </div>`;

  _startEventCountdownTimer();
}

function _formatEventTimer(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function _startEventCountdownTimer() {
  if (_eventCountdownInterval) clearInterval(_eventCountdownInterval);
  _eventCountdownInterval = setInterval(() => {
    const el = document.getElementById('hero-event-timer');
    if (!el) {
      clearInterval(_eventCountdownInterval);
      _eventCountdownInterval = null;
      return;
    }
    const remainingMs = Math.max(0, EVENT_DEFS.hero.endTimestamp - Date.now());
    el.textContent = _formatEventTimer(remainingMs);
  }, 1000);
}

function handleHeroEventAction(eventId) {
  const hero = EVENT_DEFS.hero;
  if (hero.completed) {
    showToast('🎉 Reward already claimed!', 'success');
    return;
  }
  
  if (hero.progress >= hero.target) {
    hero.completed = true;
    STATE.coins += 25000;
    if (typeof updateCoinUI === 'function') updateCoinUI();
    if (typeof spawnCollectBurst === 'function') {
      spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    SFX.reward();
    haptic('success');
    showToast('🎉 EVENT COMPLETE! +25,000 Coins claimed!', 'success');
    renderEventsScreen();
  } else {
    switchScreen('home');
  }
}

function handleEventCardClaim(e, cardId) {
  const btn = e ? e.currentTarget : null;
  if (btn) btn.classList.add('anim-btn-compress');

  const card = EVENT_DEFS.cards.find(c => c.id === cardId);
  if (!card) return;

  setTimeout(() => {
    card.completed = true;
    STATE.coins += 10000;
    if (typeof updateCoinUI === 'function') updateCoinUI();
    if (typeof spawnCollectBurst === 'function') {
      spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
    SFX.reward();
    haptic('success');
    showToast(`🎉 Claimed ${card.title} reward!`, 'success');
    renderEventsScreen();
  }, 120);
}
