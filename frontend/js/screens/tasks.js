/* ═══════════════════════════════════
   TAP EMPIRE — Daily Tasks Screen (Redesigned)
   • Header: 🎯 DAILY MISSIONS
   • Overall Progress: Today's progress (████████░░ 4 / 6 completed)
   • Compact Task Cards list with visual states (Incomplete, Completed ✓, Claimed ✓)
   • CLAIM button press animation + optional ✨ 2× BONUS ad button
═══════════════════════════════════ */

'use strict';

function renderTasksScreen() {
  const el = document.getElementById('screen-tasks');
  if (!el) return;

  if (!STATE.missions || !STATE.missions.length) {
    initMissions();
  }

  const missions = STATE.missions || [];
  const totalMissions = missions.length;
  const completedCount = missions.filter(m => m.claimed || m.progress >= m.target).length;
  const overallPct = totalMissions > 0 ? Math.min(100, (completedCount / totalMissions) * 100).toFixed(1) : 0;
  const canWatchAd = typeof canShowAd === 'function' ? canShowAd() : true;

  el.innerHTML = `
    <div class="screen-scroll tasks-page-container">
      
      <!-- ── HEADER & OVERALL PROGRESS ── -->
      <div class="tasks-header">
        <div class="tasks-title">🎯 DAILY MISSIONS</div>
        
        <div class="daily-progress-card">
          <div class="daily-progress-row">
            <span class="daily-progress-lbl">Today's progress:</span>
            <span class="daily-progress-val">${completedCount} / ${totalMissions} completed</span>
          </div>
          <div class="daily-progress-track">
            <div class="daily-progress-fill" style="width:${overallPct}%"></div>
          </div>
        </div>
      </div>

      <!-- ── COMPACT TASK CARDS LIST ── -->
      <div class="tasks-list">
        ${missions.map(m => {
          const isDone = m.claimed;
          const isComplete = m.progress >= m.target;
          const pct = Math.min(100, (m.progress / m.target) * 100);
          const rewardText = m.rewardType === 'mystery' ? '🎁 Mystery Reward' : `💰 +${fmt(m.reward)}`;

          return `
            <div class="task-card ${isDone ? 'claimed' : isComplete ? 'completed' : ''}">
              <div class="task-left">
                <div class="task-icon">${m.icon}</div>
                <div class="task-details">
                  <div class="task-name-row">
                    <span class="task-name">${esc(m.name)}</span>
                    ${isComplete && !isDone ? '<span class="task-complete-check">✓</span>' : ''}
                  </div>
                  <div class="task-desc">${esc(m.desc)}</div>
                  
                  <div class="task-prog-bar-wrap">
                    <div class="task-prog-bar-fill" style="width:${pct.toFixed(1)}%"></div>
                  </div>
                  <div class="task-prog-sub">${fmt(m.progress)} / ${fmt(m.target)}</div>
                </div>
              </div>

              <div class="task-right">
                <div class="task-reward-val">${rewardText}</div>

                ${isDone ? `
                  <div class="task-status-badge">✓ CLAIMED</div>` :
                  isComplete ? `
                  <div class="task-actions-col">
                    <button class="btn btn-gold btn-task-claim" onclick="handleClaimTask(event, '${m.id}', false)">
                      CLAIM
                    </button>
                    ${canWatchAd ? `
                      <button class="btn btn-outline btn-task-2x" onclick="handleClaimTask(event, '${m.id}', true)">
                        ✨ 2× BONUS
                      </button>` : ''}
                  </div>` : `
                  <div class="task-in-prog-pill">${pct.toFixed(0)}%</div>`
                }
              </div>
            </div>`;
        }).join('')}
      </div>

    </div>`;
}

function handleClaimTask(e, id, with2x) {
  if (e && e.currentTarget) {
    e.currentTarget.classList.add('anim-btn-compress');
  }
  setTimeout(() => {
    if (with2x && typeof claimMissionWith2x === 'function') {
      claimMissionWith2x(id).then(() => renderTasksScreen());
    } else if (typeof claimMission === 'function') {
      claimMission(id).then(() => renderTasksScreen());
    }
  }, 120);
}

