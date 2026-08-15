/* ═══════════════════════════════════
   TAP EMPIRE — Missions & Achievements
═══════════════════════════════════ */

'use strict';

const MISSIONS_DEF = [
  { id: 'tap1000', icon: '🔥', name: 'TAP MASTER', desc: 'Tap 1,000 times', type: 'tap', target: 1000, reward: 2000, rewardType: 'coins' },
  { id: 'chest2', icon: '🎁', name: 'CHEST HUNTER', desc: 'Open 2 chests', type: 'chest', target: 2, reward: 1000, rewardType: 'coins' },
  { id: 'boost1', icon: '⚡', name: 'BOOST USER', desc: 'Activate one boost', type: 'boost', target: 1, reward: 500, rewardType: 'coins' },
  { id: 'spin1', icon: '🎡', name: 'LUCKY SPIN', desc: 'Complete one spin', type: 'spin', target: 1, reward: 500, rewardType: 'mystery', mysteryLabel: 'Mystery Reward' },
  { id: 'lvlUp', icon: '⭐', name: 'LEVEL UP', desc: 'Reach Level 2', type: 'level', target: 2, reward: 1500, rewardType: 'coins' },
  { id: 'streak1', icon: '🔥', name: 'DAILY STREAK', desc: 'Maintain 1 day streak', type: 'streak', target: 1, reward: 500, rewardType: 'coins' },
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
