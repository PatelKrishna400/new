/* ═══════════════════════════════════
   TAP EMPIRE — Daily Reward System
═══════════════════════════════════ */

'use strict';

const DAILY_REWARDS = [
  { day: 1, icon: '💰', label: '100 Coins', type: 'coins', amount: 100 },
  { day: 2, icon: '💰', label: '250 Coins', type: 'coins', amount: 250 },
  { day: 3, icon: '💰', label: '500 Coins', type: 'coins', amount: 500 },
  { day: 4, icon: '⚡', label: 'Full Energy', type: 'energy', amount: 9999 },
  { day: 5, icon: '💰', label: '1,000 Coins', type: 'coins', amount: 1000 },
  { day: 6, icon: '🚀', label: '2× Boost', type: 'boost', amount: 2 },
  { day: 7, icon: '💎', label: '5,000 Coins', type: 'coins', amount: 5000 },
];

function getDailyState() {
  try {
    return JSON.parse(localStorage.getItem('te_daily') || '{}');
  } catch (_) { return {}; }
}

function canClaimDaily() {
  const ds = getDailyState();
  return Date.now() - (ds.lastClaim || 0) >= 86400000;
}

async function claimDailyReward() {
  if (!canClaimDaily()) {
    showToast('⏳ Daily reward already claimed. Come back tomorrow!');
    return;
  }
  const ds = getDailyState();
  const newIndex = ((ds.dayIndex !== undefined ? ds.dayIndex : -1) + 1) % DAILY_REWARDS.length;
  const rew = DAILY_REWARDS[newIndex];
  const newState = { lastClaim: Date.now(), streak: (ds.streak || 0) + 1, dayIndex: newIndex };
  localStorage.setItem('te_daily', JSON.stringify(newState));

  if (rew.type === 'coins') {
    STATE.coins += rew.amount;
    updateCoinUI();
    await persistUser({ coins: STATE.coins });
  } else if (rew.type === 'energy') {
    restoreEnergy(STATE.maxEnergy);           // restoreEnergy clamps to maxEnergy
    await persistUser({ energy: STATE.energy, lastEnergyUpdate: STATE.lastEnergyUpdate });
  } else if (rew.type === 'boost') {
    STATE.boostMultiplier = rew.amount;
    STATE.boostExpiry = Date.now() + 30 * 60 * 1000;
    await persistUser({ boostMultiplier: STATE.boostMultiplier, boostExpiry: STATE.boostExpiry });
  }

  const adAvailable = canShowAd();
  const bonusBtn = (adAvailable && rew.type === 'coins')
    ? `<button class="btn btn-gold" style="margin-top:8px" onclick="closeModal();doCollect('daily')">🎁 2× Reward with Ad (+${fmt(rew.amount * 2)})</button>`
    : '';

  SFX.reward();
  haptic('success');
  showModal(
    '<div style="text-align:center;padding:10px 0">' +
    '<div style="font-size:52px;margin-bottom:8px">' + rew.icon + '</div>' +
    '<div style="font-size:18px;font-weight:800;color:var(--gold);margin-bottom:4px">Day ' + rew.day + ' Reward!</div>' +
    '<div style="font-size:28px;font-weight:900;margin-bottom:8px">' + rew.label + '</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-bottom:16px">🔥 ' + newState.streak + '-day streak!</div>' +
    '<button class="btn btn-muted" onclick="closeModal()">Claim Normal</button>' +
    bonusBtn +
    '</div>'
  );
}

/* ── Render daily-reward strip into a container element ── */
function renderDailyStrip(container) {
  if (!container) return;

  const ds = getDailyState();
  const canClaim = canClaimDaily();
  const nextIdx = ((ds.dayIndex !== undefined ? ds.dayIndex : -1) + 1) % DAILY_REWARDS.length;

  /* Timer text */
  const msLeft = Math.max(0, 86400000 - (Date.now() - (ds.lastClaim || 0)));
  const hLeft = Math.floor(msLeft / 3600000);
  const mLeft = Math.floor((msLeft % 3600000) / 60000);
  const timeStr = (ds.lastClaim && ds.lastClaim > 0) ? (hLeft + 'h ' + mLeft + 'm') : '';

  /* Build day cards using string concat to avoid nested-quote issues */
  var daysHtml = '';
  for (var i = 0; i < DAILY_REWARDS.length; i++) {
    var r = DAILY_REWARDS[i];
    var isPast = (ds.dayIndex !== undefined) && (i <= ds.dayIndex) && !canClaim;
    var isCurrent = (i === nextIdx) && canClaim;
    var isNext = (i === nextIdx) && !canClaim;

    var cls = isPast ? 'daily-day claimed' :
      isCurrent ? 'daily-day current' :
        isNext ? 'daily-day next' : 'daily-day';

    var click = '';
    if (isCurrent) {
      /* Safe: no nested quotes — uses a named global function */
      click = ' onclick="_claimAndRefreshDaily()"';
    }

    daysHtml +=
      '<div class="' + cls + '"' + click + '>' +
      '<div class="daily-day-num">Day ' + r.day + '</div>' +
      '<div class="daily-day-icon">' + (isPast ? '✅' : r.icon) + '</div>' +
      '<div class="daily-day-label">' + r.label + '</div>' +
      '</div>';
  }

  container.innerHTML =
    '<div class="daily-header">' +
    '<div class="daily-streak">🔥 ' + (ds.streak || 0) + '-day streak</div>' +
    (canClaim
      ? '<div class="daily-ready">✨ Ready to claim!</div>'
      : '<div class="daily-timer">Next in ' + timeStr + '</div>') +
    '</div>' +
    '<div class="daily-days">' + daysHtml + '</div>';
}

/* ── Safe onclick target for daily-strip claim button ── */
function _claimAndRefreshDaily() {
  claimDailyReward().then(function () {
    var strip = document.getElementById('daily-strip');
    if (strip) renderDailyStrip(strip);
  });
}
