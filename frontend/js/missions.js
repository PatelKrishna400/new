/* ═══════════════════════════════════
   TAP EMPIRE — Missions & Achievements
═══════════════════════════════════ */

'use strict';

const MISSIONS_DEF = [
  /* ── ☀️ DAILY TASKS (1–18) ── */
  { id: 'd_tap100', icon: '👆', name: 'DAILY TAPPER', desc: 'Tap 100 times today', tab: 'daily', diff: 'easy', type: 'tap', target: 100, reward: 10 },
  { id: 'd_tap500', icon: '⚡', name: 'TAP SPEEDSTER', desc: 'Tap 500 times today', tab: 'daily', diff: 'easy', type: 'tap', target: 500, reward: 25 },
  { id: 'd_tap1000', icon: '🔥', name: 'DAILY TAP MASTER', desc: 'Tap 1,000 times today', tab: 'daily', diff: 'medium', type: 'tap', target: 1000, reward: 50 },
  { id: 'd_win1', icon: '🏆', name: 'FIRST WIN', desc: 'Achieve 1 win reward today', tab: 'daily', diff: 'easy', type: 'win', target: 1, reward: 15 },
  { id: 'd_win5', icon: '🔥', name: 'WINNING STREAK', desc: 'Achieve 5 win rewards today', tab: 'daily', diff: 'medium', type: 'win', target: 5, reward: 35 },
  { id: 'd_chest1', icon: '🎁', name: 'CHEST OPENER', desc: 'Open 1 Mystery Chest today', tab: 'daily', diff: 'easy', type: 'chest', target: 1, reward: 20 },
  { id: 'd_chest3', icon: '🎁', name: 'CHEST MASTER', desc: 'Open 3 Mystery Chests today', tab: 'daily', diff: 'medium', type: 'chest', target: 3, reward: 40 },
  { id: 'd_spin1', icon: '🎡', name: 'DAILY SPIN', desc: 'Spin the wheel once today', tab: 'daily', diff: 'easy', type: 'spin', target: 1, reward: 15 },
  { id: 'd_spin3', icon: '🎡', name: 'SPINNING WHEEL', desc: 'Spin the wheel 3 times today', tab: 'daily', diff: 'medium', type: 'spin', target: 3, reward: 30 },
  { id: 'd_boost1', icon: '🚀', name: 'BOOST ACTIVATION', desc: 'Activate 1 tap boost today', tab: 'daily', diff: 'easy', type: 'boost', target: 1, reward: 15 },
  { id: 'd_boost3', icon: '⚡', name: 'BOOST CHARGER', desc: 'Activate 3 tap boosts today', tab: 'daily', diff: 'medium', type: 'boost', target: 3, reward: 35 },
  { id: 'd_energy1', icon: '🔋', name: 'ENERGY RECHARGE', desc: 'Recharge energy 1 time', tab: 'daily', diff: 'easy', type: 'energy', target: 1, reward: 15 },
  { id: 'd_streak1', icon: '📅', name: 'DAILY LOGIN', desc: 'Maintain 1-day login streak', tab: 'daily', diff: 'easy', type: 'streak', target: 1, reward: 10 },
  { id: 'd_upg1', icon: '⬆️', name: 'POWER UPGRADE', desc: 'Upgrade Tap Power 1 time', tab: 'daily', diff: 'easy', type: 'upgrade', target: 1, reward: 20 },
  { id: 'd_earn1k', icon: '💰', name: 'COIN COLLECTOR', desc: 'Earn 1,000 coins today', tab: 'daily', diff: 'medium', type: 'coins', target: 1000, reward: 40 },
  { id: 'd_crit1', icon: '💥', name: 'CRITICAL HIT', desc: 'Score 1 Critical Tap today', tab: 'daily', diff: 'easy', type: 'crit', target: 1, reward: 15 },
  { id: 'd_combo1', icon: '🔥', name: 'COMBO RUNNER', desc: 'Reach a 10x Combo streak', tab: 'daily', diff: 'medium', type: 'combo', target: 10, reward: 30 },
  { id: 'd_completeAll', icon: '👑', name: 'DAILY COMPLETION', desc: 'Complete 5 daily tasks', tab: 'daily', diff: 'hard', type: 'collect', target: 5, reward: 100 },

  /* ── 📅 WEEKLY TASKS (19–35) ── */
  { id: 'w_tap5k', icon: '💪', name: 'WEEKLY MARATHON', desc: 'Tap 5,000 times this week', tab: 'weekly', diff: 'medium', type: 'tap', target: 5000, reward: 150 },
  { id: 'w_tap10k', icon: '🔥', name: 'WEEKLY TAP CHAMP', desc: 'Tap 10,000 times this week', tab: 'weekly', diff: 'hard', type: 'tap', target: 10000, reward: 300 },
  { id: 'w_win10', icon: '🏆', name: 'WEEKLY VICTOR', desc: 'Achieve 10 win rewards', tab: 'weekly', diff: 'medium', type: 'win', target: 10, reward: 100 },
  { id: 'w_win20', icon: '👑', name: 'CHAMPION OF WINS', desc: 'Achieve 20 win rewards', tab: 'weekly', diff: 'hard', type: 'win', target: 20, reward: 250 },
  { id: 'w_chest5', icon: '🎁', name: 'CHEST HOARDER', desc: 'Open 5 Mystery Chests', tab: 'weekly', diff: 'medium', type: 'chest', target: 5, reward: 100 },
  { id: 'w_spin5', icon: '🎡', name: 'SPIN ENTHUSIAST', desc: 'Spin the wheel 5 times', tab: 'weekly', diff: 'medium', type: 'spin', target: 5, reward: 80 },
  { id: 'w_lvl5', icon: '⭐', name: 'LEVEL 5 ACHIEVER', desc: 'Reach Level 5 player status', tab: 'weekly', diff: 'easy', type: 'level', target: 5, reward: 75 },
  { id: 'w_lvl10', icon: '🌟', name: 'LEVEL 10 MASTER', desc: 'Reach Level 10 player status', tab: 'weekly', diff: 'medium', type: 'level', target: 10, reward: 150 },
  { id: 'w_streak3', icon: '📅', name: '3-DAY STREAK', desc: 'Maintain 3 consecutive login days', tab: 'weekly', diff: 'easy', type: 'streak', target: 3, reward: 50 },
  { id: 'w_streak7', icon: '🔥', name: '7-DAY STREAK', desc: 'Maintain 7 consecutive login days', tab: 'weekly', diff: 'medium', type: 'streak', target: 7, reward: 150 },
  { id: 'w_ref1', icon: '👥', name: 'FRIEND INVITE', desc: 'Invite 1 friend to the game', tab: 'weekly', diff: 'medium', type: 'referral', target: 1, reward: 100 },
  { id: 'w_ref3', icon: '👥', name: 'SQUAD BUILDER', desc: 'Invite 3 friends to the game', tab: 'weekly', diff: 'hard', type: 'referral', target: 3, reward: 250 },
  { id: 'w_earn10k', icon: '💰', name: 'COIN HOARDER', desc: 'Earn 10,000 coins total', tab: 'weekly', diff: 'medium', type: 'coins', target: 10000, reward: 120 },
  { id: 'w_upg5', icon: '⬆️', name: 'UPGRADE MASTER', desc: 'Perform 5 upgrades', tab: 'weekly', diff: 'medium', type: 'upgrade', target: 5, reward: 100 },
  { id: 'w_boost5', icon: '🚀', name: 'BOOST KING', desc: 'Activate 5 boosts total', tab: 'weekly', diff: 'medium', type: 'boost', target: 5, reward: 100 },
  { id: 'w_crit10', icon: '💥', name: 'CRITICAL STRIKER', desc: 'Score 10 Critical Taps', tab: 'weekly', diff: 'medium', type: 'crit', target: 10, reward: 80 },
  { id: 'w_weeklyChamp', icon: '🏆', name: 'WEEKLY GRAND MASTERY', desc: 'Complete 10 weekly tasks', tab: 'weekly', diff: 'hard', type: 'collect', target: 10, reward: 500 },

  /* ── 🏆 MONTHLY TASKS / SEASON (36–52) ── */
  { id: 'm_tap25k', icon: '💪', name: 'MONTHLY TAP TITAN', desc: 'Tap 25,000 times this month', tab: 'monthly', diff: 'medium', type: 'tap', target: 25000, reward: 500 },
  { id: 'm_tap50k', icon: '🔥', name: 'MONTHLY TAP LEGEND', desc: 'Tap 50,000 times this month', tab: 'monthly', diff: 'hard', type: 'tap', target: 50000, reward: 1000 },
  { id: 'm_win50', icon: '🏆', name: '50 VICTORIES', desc: 'Achieve 50 win rewards', tab: 'monthly', diff: 'hard', type: 'win', target: 50, reward: 600 },
  { id: 'm_chest15', icon: '🎁', name: 'CHEST CONNOISSEUR', desc: 'Open 15 Mystery Chests', tab: 'monthly', diff: 'medium', type: 'chest', target: 15, reward: 350 },
  { id: 'm_spin15', icon: '🎡', name: 'WHEEL MASTER', desc: 'Spin the wheel 15 times', tab: 'monthly', diff: 'medium', type: 'spin', target: 15, reward: 300 },
  { id: 'm_lvl20', icon: '🌟', name: 'LEVEL 20 ELITE', desc: 'Reach Level 20 status', tab: 'monthly', diff: 'medium', type: 'level', target: 20, reward: 400 },
  { id: 'm_lvl50', icon: '💎', name: 'LEVEL 50 GRANDMASTER', desc: 'Reach Level 50 status', tab: 'monthly', diff: 'hard', type: 'level', target: 50, reward: 1000 },
  { id: 'm_ref5', icon: '👥', name: 'REFERRAL MASTER', desc: 'Invite 5 active friends', tab: 'monthly', diff: 'hard', type: 'referral', target: 5, reward: 500 },
  { id: 'm_earn50k', icon: '💰', name: '50K COIN VAULT', desc: 'Earn 50,000 total coins', tab: 'monthly', diff: 'medium', type: 'coins', target: 50000, reward: 400 },
  { id: 'm_earn100k', icon: '💎', name: '100K COIN TREASURY', desc: 'Earn 100,000 total coins', tab: 'monthly', diff: 'hard', type: 'coins', target: 100000, reward: 800 },
  { id: 'm_upg15', icon: '⬆️', name: 'MAX UPGRADER', desc: 'Perform 15 upgrades', tab: 'monthly', diff: 'medium', type: 'upgrade', target: 15, reward: 350 },
  { id: 'm_boost15', icon: '🚀', name: 'POWER OVERLOAD', desc: 'Activate 15 boosts', tab: 'monthly', diff: 'medium', type: 'boost', target: 15, reward: 350 },
  { id: 'm_combo50', icon: '🔥', name: '50X COMBO GOD', desc: 'Achieve a 50x Combo streak', tab: 'monthly', diff: 'hard', type: 'combo', target: 50, reward: 500 },
  { id: 'm_crit50', icon: '💥', name: 'CRITICAL OVERLORD', desc: 'Score 50 Critical Taps', tab: 'monthly', diff: 'medium', type: 'crit', target: 50, reward: 300 },
  { id: 'm_achieve10', icon: '🏆', name: 'ACHIEVEMENT HUNTER', desc: 'Unlock 10 achievements', tab: 'monthly', diff: 'hard', type: 'achievement', target: 10, reward: 750 },
  { id: 'm_seasonPass', icon: '👑', name: 'SEASON CHAMPIONSHIP', desc: 'Complete 20 season tasks', tab: 'monthly', diff: 'hard', type: 'collect', target: 20, reward: 1000 },
  { id: 'm_ultimateLegend', icon: '🌟', name: 'ULTIMATE TAP EMPIRE LEGEND', desc: 'Reach 1,000,000 coin milestone', tab: 'monthly', diff: 'hard', type: 'coins', target: 1000000, reward: 2000 },
];

const ACHIEVEMENTS_DEF = [
  { id: 'first_tap', icon: '👆', name: 'First Tap', desc: 'Tap for the first time', type: 'tap', target: 1, reward: 50 },
  { id: 'tap100', icon: '👆', name: 'Tapper', desc: 'Tap 100 times', type: 'tap', target: 100, reward: 100 },
  { id: 'tap1k', icon: '💪', name: 'Power Tapper', desc: 'Tap 1,000 times', type: 'tap', target: 1000, reward: 500 },
  { id: 'tap10k', icon: '🔥', name: 'Tap Master', desc: 'Tap 10,000 times', type: 'tap', target: 10000, reward: 2000 },
  { id: 'tap100k', icon: '🏆', name: 'Tap Legend', desc: 'Tap 100,000 times', type: 'tap', target: 100000, reward: 10000 },
  { id: 'lvl10', icon: '⭐', name: 'Rising Star', desc: 'Reach Level 10', type: 'level', target: 10, reward: 2000 },
  { id: 'lvl25', icon: '🌟', name: 'Elite', desc: 'Reach Level 25', type: 'level', target: 25, reward: 5000 },
  { id: 'lvl50', icon: '💎', name: 'Champion', desc: 'Reach Level 50', type: 'level', target: 50, reward: 15000 },
  { id: 'collect10', icon: '🎁', name: 'Collector', desc: 'Collect 10 bonuses', type: 'collect', target: 10, reward: 1000 },
  { id: 'ads20', icon: '🎯', name: 'Bonus Hunter', desc: 'Earn 20 bonus rewards', type: 'ad', target: 20, reward: 5000 },
  { id: 'coins100k', icon: '💰', name: 'Coin Collector', desc: 'Earn 100,000 coins total', type: 'coins', target: 100000, reward: 1000 },
];

function initMissions() {
  const stored = JSON.parse(localStorage.getItem('te_missions') || '{}');
  STATE.missions = MISSIONS_DEF.map(m => ({
    ...m,
    progress: stored[m.id]?.progress !== undefined ? stored[m.id].progress : (m.id === 'tap1000' ? 750 : m.id === 'chest2' ? 1 : m.id === 'boost1' ? 1 : m.id === 'spin1' ? 1 : m.id === 'streak1' ? 1 : 0),
    claimed: stored[m.id]?.claimed || false,
  }));
}

function saveMissions() {
  const obj = {};
  STATE.missions.forEach(m => { obj[m.id] = { progress: m.progress, claimed: m.claimed }; });
  localStorage.setItem('te_missions', JSON.stringify(obj));
}

function updateMissionProgress(type, delta) {
  let changed = false;
  STATE.missions.forEach(m => {
    if (m.claimed) return;
    if (m.type === type) {
      if (type === 'level') { if (STATE.level >= m.target) m.progress = STATE.level; }
      else { m.progress = Math.min(m.target, m.progress + delta); }
      changed = true;
    }
  });
  if (changed) saveMissions();
}

async function claimMission(id) {
  const m = STATE.missions.find(x => x.id === id);
  if (!m || m.claimed || m.progress < m.target) return;
  m.claimed = true;
  STATE.coins += m.reward;
  updateCoinUI();
  saveMissions();
  SFX.reward();
  haptic('success');
  if (typeof spawnCollectBurst === 'function') {
    spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
  }
  showToast(`✅ Mission: ${m.name} — +${fmt(m.reward)} Coins`);
  updateMissionProgress('collect', 0); // refresh UI
  await persistUser({ coins: STATE.coins });
}

async function claimMissionWith2x(id) {
  const m = STATE.missions.find(x => x.id === id);
  if (!m || m.claimed || m.progress < m.target) return;
  m.claimed = true;
  const rewardAmt = m.reward * 2;
  STATE.coins += rewardAmt;
  updateCoinUI();
  saveMissions();
  SFX.reward();
  haptic('success');
  if (typeof spawnCollectBurst === 'function') {
    spawnCollectBurst(window.innerWidth / 2, window.innerHeight / 2);
  }
  showToast(`✨ 2× BONUS! Mission: ${m.name} — +${fmt(rewardAmt)} Coins`, 'success');
  updateMissionProgress('collect', 0);
  await persistUser({ coins: STATE.coins });
}

/* ── Achievements ── */
function initAchievements() {
  const stored = JSON.parse(localStorage.getItem('te_ach') || '{}');
  STATE.achievements = ACHIEVEMENTS_DEF.map(a => ({
    ...a,
    progress: stored[a.id]?.progress || 0,
    unlocked: stored[a.id]?.unlocked || false,
  }));
}

function checkAchievements() {
  let changed = false;
  STATE.achievements.forEach(a => {
    if (a.unlocked) return;
    let prog = a.progress;
    if (a.type === 'tap')     prog = STATE.totalTaps;
    if (a.type === 'level')   prog = STATE.level;
    if (a.type === 'ad')      prog = STATE.totalAdViews;
    if (a.type === 'coins')   prog = STATE.coins;
    if (a.type === 'collect') prog = STATE.adDailyCount; // rough proxy
    a.progress = prog;
    if (prog >= a.target) {
      a.unlocked = true;
      STATE.coins += a.reward;
      updateCoinUI();
      SFX.achievement();
      showAchievementModal(a);
      changed = true;
    }
  });
  if (changed) {
    const obj = {};
    STATE.achievements.forEach(a => { obj[a.id] = { progress: a.progress, unlocked: a.unlocked }; });
    localStorage.setItem('te_ach', JSON.stringify(obj));
  }
}
