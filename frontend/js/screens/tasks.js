/* ═══════════════════════════════════
   TAP EMPIRE — Daily Tasks Screen (Redesigned)
   • Header: 🎯 DAILY MISSIONS
   • Overall Progress: Today's progress (████████░░ 4 / 6 completed)
   • Compact Task Cards list with visual states (Incomplete, Completed ✓, Claimed ✓)
   • CLAIM button press animation + optional ✨ 2× BONUS ad button
═══════════════════════════════════ */

'use strict';

let _activeTaskTab = 'daily';
let _activeTaskFilter = 'all';

function renderTasksScreen() {
  const el = document.getElementById('screen-tasks');
  if (!el) return;

  if (!STATE.missions || !STATE.missions.length) {
    initMissions();
  }

  const allMissions = STATE.missions || [];
  
  /* Filter by active tab (daily, weekly, monthly) */
  const tabMissions = allMissions.filter(m => (m.tab || 'daily') === _activeTaskTab);
  
  /* Filter by difficulty or status */
  const filteredMissions = tabMissions.filter(m => {
    if (_activeTaskFilter === 'all') return true;
    if (_activeTaskFilter === 'completed') return m.claimed;
    return (m.diff || 'easy') === _activeTaskFilter;
  });

  const totalMissions = tabMissions.length;
  const completedCount = tabMissions.filter(m => m.claimed || m.progress >= m.target).length;
  const overallPct = totalMissions > 0 ? Math.min(100, (completedCount / totalMissions) * 100).toFixed(1) : 0;
  const canWatchAd = typeof canShowAd === 'function' ? canShowAd() : true;

  el.innerHTML = `
    <div class="screen-scroll tasks-page-container">
      
      <!-- ── HEADER & OVERALL PROGRESS ── -->
      <div class="tasks-header">
        <div class="tasks-title">🎯 MISSIONS & TASKS</div>
        
        <div class="daily-progress-card">
          <div class="daily-progress-row">
            <span class="daily-progress-lbl">${_activeTaskTab.toUpperCase()} Progress:</span>
            <span class="daily-progress-val">${completedCount} / ${totalMissions} completed</span>
          </div>
          <div class="daily-progress-track">
            <div class="daily-progress-fill" style="width:${overallPct}%"></div>
          </div>
        </div>
      </div>

      <!-- ── 3-TAB NAVIGATION (DAILY, WEEKLY, MONTHLY) ── -->
      <div class="task-tabs-row">
        <button class="task-tab-btn ${_activeTaskTab === 'daily' ? 'active' : ''}" onclick="_switchTaskTab('daily')">
          ☀️ DAILY
        </button>
        <button class="task-tab-btn ${_activeTaskTab === 'weekly' ? 'active' : ''}" onclick="_switchTaskTab('weekly')">
          📅 WEEKLY
        </button>
        <button class="task-tab-btn ${_activeTaskTab === 'monthly' ? 'active' : ''}" onclick="_switchTaskTab('monthly')">
          🏆 MONTHLY
        </button>
      </div>

      <!-- ── DIFFICULTY / STATUS FILTERS ── -->
      <div class="task-filters-row">
        <button class="filter-chip ${_activeTaskFilter === 'all' ? 'active' : ''}" onclick="_switchTaskFilter('all')">ALL</button>
        <button class="filter-chip ${_activeTaskFilter === 'easy' ? 'active' : ''}" onclick="_switchTaskFilter('easy')">EASY</button>
        <button class="filter-chip ${_activeTaskFilter === 'medium' ? 'active' : ''}" onclick="_switchTaskFilter('medium')">MEDIUM</button>
        <button class="filter-chip ${_activeTaskFilter === 'hard' ? 'active' : ''}" onclick="_switchTaskFilter('hard')">HARD</button>
        <button class="filter-chip ${_activeTaskFilter === 'completed' ? 'active' : ''}" onclick="_switchTaskFilter('completed')">COMPLETED</button>
      </div>

      <!-- ── TASK CARDS LIST ── -->
      <div class="tasks-list">
        ${filteredMissions.length === 0 ? `
          <div class="empty-state">No tasks found in this section.</div>
        ` : filteredMissions.map(m => {
          const isDone = m.claimed;
          const isComplete = m.progress >= m.target;
          const pct = Math.min(100, (m.progress / m.target) * 100);
          const rewardText = `💰 +${fmt(m.reward)}`;

          return `
            <div class="task-card ${isDone ? 'claimed' : isComplete ? 'completed' : ''}">
              <div class="task-left">
                <div class="task-icon">${m.icon}</div>
                <div class="task-details">
                  <div class="task-name-row">
                    <span class="task-name">${esc(m.name)}</span>
                    <span class="task-diff-tag diff-${m.diff || 'easy'}">${(m.diff || 'easy').toUpperCase()}</span>
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
                        📺 2× AD BONUS
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

function _switchTaskTab(tab) {
  _activeTaskTab = tab;
  renderTasksScreen();
}

function _switchTaskFilter(filter) {
  _activeTaskFilter = filter;
  renderTasksScreen();
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

