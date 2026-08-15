/* ═══════════════════════════════════
   TAP EMPIRE — Achievements (standalone)
   Logic lives here; definitions are in
   missions.js alongside ACHIEVEMENTS_DEF.
═══════════════════════════════════ */

'use strict';

/* ── Render achievements grid into a container ── */
function renderAchievementsGrid(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="section-title" style="margin:0 0 10px">
      Achievements
      <span class="badge-count" id="ach-count"></span>
    </div>
    <div class="achieve-grid" id="achieve-grid">
      ${STATE.achievements.map(a => {
        const pct = Math.min(100, (a.progress / a.target) * 100);
        return `
          <div class="achieve-card ${a.unlocked ? 'unlocked' : ''}">
            <div class="achieve-icon">${a.icon}</div>
            <div class="achieve-info">
              <div class="achieve-name">${esc(a.name)}</div>
              <div class="achieve-desc">${esc(a.desc)}</div>
              ${a.unlocked
                ? '<div class="achieve-done">✅ Unlocked</div>'
                : `<div class="achieve-prog-wrap">
                    <div class="achieve-prog-fill" style="width:${pct.toFixed(1)}%"></div>
                   </div>
                   <div class="achieve-prog-text">${fmt(a.progress)} / ${fmt(a.target)}</div>`}
            </div>
            <div class="achieve-reward">+${fmt(a.reward)}</div>
          </div>`;
      }).join('')}
    </div>`;

  // Update unlocked count badge
  const done = STATE.achievements.filter(a => a.unlocked).length;
  const badge = container.querySelector('#ach-count');
  if (badge) badge.textContent = `${done}/${STATE.achievements.length}`;
}

/* ── Refresh achievements section without full re-render ── */
function refreshAchievements() {
  checkAchievements();
  const grid = document.getElementById('achieve-grid');
  if (grid) renderAchievementsGrid(grid.closest('.achieve-section') || grid.parentElement);
}
