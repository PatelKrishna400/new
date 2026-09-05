/* ==========================================================================
   ENERGY TAP REACTOR - TASKS & QUESTS (pages/tasks/tasks.js)
   - Fixed Uniform Tab Size (58px Height, styled like Mega Reward page)
   - Numeric present value text removed from the tab card
   - Left-to-right animated Water / Liquid Color Fill based on progress value
   - Interactive Task Notes Pop-Up Modal on tab click
   - 1 Scratch Card Reward for all Daily Tasks & Emoji Burst Animation
   ========================================================================== */

const DAILY_TASKS = [
  {
    id: 'd1',
    number: 1,
    title: '1. Tap 2,000 Times',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Tap the central orb 2,000 times on the Home page to win 1 Scratch Card',
    notes: 'Tap the glowing central reactor orb on the Home screen to accumulate energy taps. Each tap powers up your reactor core and advances toward completing this quest.',
    tip: 'Tip: Tap with multiple fingers simultaneously to hit 2,000 taps rapidly!',
    type: 'tap',
    target: 2000,
    iconType: 'lightning',
    colorClass: 'task-cyan',
    iconClass: 'task-icon-cyan',
    accentClass: 'task-tab-accent-cyan',
    liquidTheme: 'liquid-cyan',
    tagClass: 'tag-cyan',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd2',
    number: 2,
    title: '2. Tap 5,000 Times',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Reach 5,000 total taps on the central orb to win 1 Scratch Card',
    notes: 'Generate 5,000 total taps on the Home screen reactor. Continuous tapping fills your reactor pressure gauge and unlocks bonus energy.',
    tip: 'Tip: Keep energy regeneration high to sustain long tapping sessions.',
    type: 'tap',
    target: 5000,
    iconType: 'lightning',
    colorClass: 'task-blue',
    iconClass: 'task-icon-blue',
    accentClass: 'task-tab-accent-blue',
    liquidTheme: 'liquid-blue',
    tagClass: 'tag-blue',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd3',
    number: 3,
    title: '3. Tap 10,000 Times',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Harvest 10,000 taps on the central orb to win 1 Scratch Card',
    notes: 'Master your reactor tapping power by completing 10,000 taps today. Achieving this major daily quest proves your dedication to the empire.',
    tip: 'Tip: Unlock higher reactor tiers to maximize the value of every single tap.',
    type: 'tap',
    target: 10000,
    iconType: 'lightning',
    colorClass: 'task-green',
    iconClass: 'task-icon-green',
    accentClass: 'task-tab-accent-green',
    liquidTheme: 'liquid-green',
    tagClass: 'tag-green',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd5',
    number: 4,
    title: '4. Use 30 Green Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 30 Green Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Navigate to the Energy Generator page and use 30 Green Fuel cells to power your passive energy turbines and increase per-second income.',
    tip: 'Tip: Fuel can be gathered from Lucky Wheel spins, Mystery Chests, and Daily Streaks.',
    type: 'fuel_green',
    target: 30,
    iconType: 'pump',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd6',
    number: 5,
    title: '5. Use 10 Yellow Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 10 Yellow Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 10 high-density Yellow Fuel cells in the Energy Generator to accelerate your passive energy income and fuel reactor cores.',
    tip: 'Tip: Yellow fuel provides double the power generation of standard green cells.',
    type: 'fuel_yellow',
    target: 10,
    iconType: 'pump',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd7',
    number: 6,
    title: '6. Use 30 Yellow Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 30 Yellow Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 30 Yellow Fuel cells in the Energy Generator today. Sustained fuel injection ensures uninterrupted reactor charging.',
    tip: 'Tip: Keep all fuel chambers loaded to maximize overnight offline generation.',
    type: 'fuel_yellow',
    target: 30,
    iconType: 'pump',
    colorClass: 'task-orange',
    iconClass: 'task-icon-orange',
    accentClass: 'task-tab-accent-orange',
    liquidTheme: 'liquid-orange',
    tagClass: 'tag-orange',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd8',
    number: 7,
    title: '7. Use 5 Orange Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 5 Orange Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 5 supercharged Orange Fuel cells in the Energy Generator. High-octane orange plasma generates tremendous energy spikes.',
    tip: 'Tip: Orange fuel is rare—find them in 7-day streak drops and mystery chest tier 3.',
    type: 'fuel_orange',
    target: 5,
    iconType: 'pump',
    colorClass: 'task-orange',
    iconClass: 'task-icon-orange',
    accentClass: 'task-tab-accent-orange',
    liquidTheme: 'liquid-orange',
    tagClass: 'tag-orange',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd9',
    number: 8,
    title: '8. Use 1 Red Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 1 Red Fuel cell in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 1 ultra-rare Red Fuel cell in the Energy Generator to trigger critical core overclock and boost per-second production permanently.',
    tip: 'Tip: Red Fuel provides an instant +0.01 EP/Sec rate bonus!',
    type: 'fuel_red',
    target: 1,
    iconType: 'pump',
    colorClass: 'task-red',
    iconClass: 'task-icon-red',
    accentClass: 'task-tab-accent-red',
    liquidTheme: 'liquid-red',
    tagClass: 'tag-red',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd_spin_50',
    number: 9,
    title: '9. Spin 50 per day',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Spin the Lucky Wheel 50 times in a day to win 1 Scratch Card',
    notes: 'Spin the Lucky Prize Wheel 50 times today. Every spin gives you a chance to win keys, tickets, fuel cells, and huge jackpot coin prizes.',
    tip: 'Tip: If tickets run low, watch a quick ad to claim free tickets instantly.',
    type: 'spin',
    target: 50,
    iconType: 'spin',
    colorClass: 'task-purple',
    iconClass: 'task-icon-purple',
    accentClass: 'task-tab-accent-purple',
    liquidTheme: 'liquid-purple',
    tagClass: 'tag-purple',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd_chest_50',
    number: 10,
    title: '10. Chest play 50 per day',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Unlock and open 50 Mystery Chests in a day to win 1 Scratch Card',
    notes: 'Unlock 50 Mystery Chests using Winning Keys today. Pick any of the 3 side-by-side chests to reveal hidden rewards and rare fuel.',
    tip: 'Tip: Earn keys from Telegram tasks or claim free keys via video ads.',
    type: 'chest',
    target: 50,
    iconType: 'chest',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd_scratch_30',
    number: 11,
    title: '11. Card scratch 30 per day',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Play and scratch 30 Scratch Cards in a day to win 1 Scratch Card',
    notes: 'Scratch away the metallic gray tap foil on 30 holographic cards today. Match 3 identical items to trigger a huge Jackpot win!',
    tip: 'Tip: Tap or swipe across all 9 cells to burn the gray cover with flame embers.',
    type: 'scratch',
    target: 30,
    iconType: 'scratch',
    colorClass: 'task-pink',
    iconClass: 'task-icon-pink',
    accentClass: 'task-tab-accent-pink',
    liquidTheme: 'liquid-pink',
    tagClass: 'tag-pink',
    tagText: 'DAILY QUEST'
  },
  {
    id: 'd_egg_50',
    number: 12,
    title: '12. Hatch egg 50 per day',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Crack and hatch 50 Cyber Eggs in a day to win 1 Scratch Card',
    notes: 'Crack open 50 Cyber Eggs in the 16-Egg Hatchery grid. Collect 3 matching keys, cards, tickets, or coins to win instant sets.',
    tip: 'Tip: Use the reshuffle button anytime if you want a fresh set of eggs!',
    type: 'egg',
    target: 50,
    iconType: 'egg',
    colorClass: 'task-green',
    iconClass: 'task-icon-green',
    accentClass: 'task-tab-accent-green',
    liquidTheme: 'liquid-green',
    tagClass: 'tag-green',
    tagText: 'DAILY QUEST'
  }
];

const TELEGRAM_TASKS = [
  {
    id: 'tg1',
    title: 'Join Channel: Earn to ads',
    rewardText: '1 Key for Chest',
    rewardKeys: 1,
    desc: 'Join @Earn_to_ads official Telegram channel to win 1 Key for Chest',
    notes: 'Join the official @Earn_to_ads Telegram announcements channel. Stay up to date with new event drops, promo codes, and special community gifts.',
    tip: 'Tip: Make sure you remain in the channel to continue receiving partner bonuses.',
    iconType: 'plane',
    btnText: 'Join Channel',
    url: 'https://t.me/Earn_to_ads',
    colorClass: 'task-blue',
    iconClass: 'task-icon-blue',
    accentClass: 'task-tab-accent-blue',
    liquidTheme: 'liquid-blue',
    tagClass: 'tag-blue',
    tagText: 'TELEGRAM'
  },
  {
    id: 'tg2',
    title: 'Join Bot: Prover Svoi Akk',
    rewardText: '1 Key for Chest',
    rewardKeys: 1,
    desc: 'Launch and start @prover_svoiakk_bot on Telegram to win 1 Key for Chest',
    notes: 'Launch and start our verified partner Telegram bot @prover_svoiakk_bot. Tap start inside Telegram to claim your free Mystery Chest Key.',
    tip: 'Tip: Tap the button below to launch the bot directly in Telegram.',
    iconType: 'bot',
    btnText: 'Join Bot',
    url: 'https://t.me/prover_svoiakk_bot',
    colorClass: 'task-blue',
    iconClass: 'task-icon-blue',
    accentClass: 'task-tab-accent-blue',
    liquidTheme: 'liquid-blue',
    tagClass: 'tag-blue',
    tagText: 'TELEGRAM BOT'
  },
  {
    id: 'tg3',
    title: 'Join Bot: Stars One Click',
    rewardText: '2 Keys for Chest',
    rewardKeys: 2,
    desc: 'Launch and start @stars_oneklic_bot on Telegram to win 2 Keys for Chest',
    notes: 'Launch and start @stars_oneklic_bot on Telegram. Discover one-click Telegram stars and immediately claim 2 Mystery Chest Keys!',
    tip: 'Tip: Double key reward—unlock 2 mystery chests back-to-back!',
    iconType: 'bot',
    btnText: 'Join Bot',
    url: 'https://t.me/stars_oneklic_bot',
    colorClass: 'task-blue',
    iconClass: 'task-icon-blue',
    accentClass: 'task-tab-accent-blue',
    liquidTheme: 'liquid-blue',
    tagClass: 'tag-blue',
    tagText: 'TELEGRAM BOT'
  }
];

// Subtab Switcher
function switchTaskSubtab(subtabName) {
  gameState.taskSubtab = subtabName;
  const subDaily = (DOM && DOM.subtabDaily) || document.getElementById('subtabDaily');
  const subTelegram = (DOM && DOM.subtabTelegram) || document.getElementById('subtabTelegram');
  if (subDaily && subTelegram) {
    if (subtabName === 'daily') {
      subDaily.classList.add('active');
      subTelegram.classList.remove('active');
    } else {
      subDaily.classList.remove('active');
      subTelegram.classList.add('active');
    }
  }
  sfx.playTapSound(1);
  renderTasksList();
}

// Get Icon SVG string based on iconType
function getTaskIconSvg(iconType) {
  if (iconType === 'lightning') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>`;
  } else if (iconType === 'pump') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 22V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v17"/>
      <path d="M13 10h4a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"/>
      <rect x="6" y="7" width="4" height="4" rx="1"/>
    </svg>`;
  } else if (iconType === 'spin') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3v9l6.36 6.36"/>
      <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
      <path d="M16.24 7.76l-4.24 4.24"/>
    </svg>`;
  } else if (iconType === 'chest') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 9h20v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z"/>
      <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/>
      <path d="M10 13h4"/>
      <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
    </svg>`;
  } else if (iconType === 'scratch') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 9h18"/>
      <path d="M3 15h18"/>
      <path d="M9 3v18"/>
      <path d="M15 3v18"/>
    </svg>`;
  } else if (iconType === 'egg') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12z"/>
      <path d="M9.5 12l2.5 2-1 2 3.5 1.5"/>
    </svg>`;
  } else if (iconType === 'plane') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>`;
  } else {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>`;
  }
}

// Compute current progress for a given task
function getTaskCurrentProgress(task) {
  if (task.type === 'tap') {
    return gameState.reactor.energyTaps || 0;
  } else if (task.type === 'fuel_green') {
    return (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.green) || 0;
  } else if (task.type === 'fuel_yellow') {
    return (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.yellow) || 0;
  } else if (task.type === 'fuel_orange') {
    return (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.orange) || 0;
  } else if (task.type === 'fuel_red') {
    return (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.red) || 0;
  } else if (task.type === 'spin') {
    return (gameState.dailyStats && gameState.dailyStats.spins) || 0;
  } else if (task.type === 'chest') {
    return (gameState.dailyStats && gameState.dailyStats.chests) || 0;
  } else if (task.type === 'scratch') {
    return (gameState.dailyStats && gameState.dailyStats.scratches) || 0;
  } else if (task.type === 'egg') {
    return (gameState.dailyStats && gameState.dailyStats.eggs) || 0;
  }
  return 0;
}

// Map task type to navigation screen
function getTaskNavTarget(task) {
  if (task.type === 'tap') return { page: 'home', text: 'Go to Tap' };
  if (task.type && task.type.startsWith('fuel_')) return { page: 'energy', text: 'Go to Energy' };
  if (task.type === 'spin') return { page: 'spin', text: 'Go to Spin' };
  if (task.type === 'chest') return { page: 'chest', text: 'Go to Chest' };
  if (task.type === 'scratch') return { page: 'scratch', text: 'Go to Scratch' };
  if (task.type === 'egg') return { page: 'egg', text: 'Go to Hatchery' };
  return { page: 'home', text: 'Go to Task' };
}

// Render Tasks List (Fixed 58px Tab, Liquid Water Fill, Numeric value removed, Notes modal on click)
function renderTasksList() {
  const container = (DOM && DOM.tasksListContainer) || document.getElementById('tasksListContainer');
  if (!container) return;
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();

  if (!gameState.tasksState) {
    gameState.tasksState = { claimedDaily: {}, claimedTelegram: {} };
  }
  if (!gameState.tasksState.claimedDaily) gameState.tasksState.claimedDaily = {};
  if (!gameState.tasksState.claimedTelegram) gameState.tasksState.claimedTelegram = {};

  const dailyBadge = (DOM && DOM.dailyBadgeCount) || document.getElementById('dailyBadgeCount');
  const tgBadge = (DOM && DOM.telegramBadgeCount) || document.getElementById('telegramBadgeCount');

  if (gameState.taskSubtab === 'daily') {
    const activeDailyTasks = DAILY_TASKS.filter(task => !gameState.tasksState.claimedDaily[task.id]);

    if (dailyBadge) {
      dailyBadge.textContent = activeDailyTasks.length;
    }

    if (activeDailyTasks.length === 0) {
      container.innerHTML = `
        <div class="tasks-empty-complete-card">
          <div class="empty-trophy-icon">🏆</div>
          <h4 class="empty-title">All Daily Tasks Complete!</h4>
          <p class="empty-desc">You claimed all Scratch Cards for today! Check back tomorrow for fresh daily quests.</p>
        </div>
      `;
      return;
    }

    let html = '';
    activeDailyTasks.forEach(task => {
      const currentProgress = getTaskCurrentProgress(task);
      const percent = Math.min(100, Math.floor((currentProgress / task.target) * 100));
      const fillWidth = Math.max(percent, 2);
      const isReadyToClaim = currentProgress >= task.target;
      const iconSvg = getTaskIconSvg(task.iconType);

      // Render Fixed 58px Tab with Water Liquid Fill & First Point Color Glow
      html += `
        <div class="task-decorated-tab-card ${task.colorClass} ${task.liquidTheme} ${isReadyToClaim ? 'is-ready' : ''}" 
             id="taskCard-${task.id}" 
             onclick="openTaskNotesPopup('${task.id}', 'daily')" 
             role="button" 
             tabindex="0">
          
          <!-- Animated Water / Liquid Color Fill from Left to Right with Glowing Starting & Leading Points -->
          <div class="task-liquid-layer">
            <div class="task-liquid-fill" style="width: ${fillWidth}%;">
              <div class="task-liquid-start-point"></div>
              <div class="task-liquid-wave"></div>
              <div class="task-liquid-leading-point"></div>
            </div>
          </div>

          <!-- Left Neon Accent Bar -->
          <div class="task-tab-accent-bar ${task.accentClass}"></div>

          <!-- 3D Glassmorphic Icon Box (38x38px) -->
          <div class="task-tab-icon-box ${task.iconClass}">
            ${iconSvg}
          </div>

          <!-- Title & Category Info (Numeric value removed per user requirement!) -->
          <div class="task-tab-text-info">
            <div class="task-tab-title-row">
              <span class="task-tab-title">${task.title}</span>
              <span class="task-cat-tag ${task.tagClass}">${task.tagText}</span>
            </div>
          </div>

          <!-- Right Action: Glowing Claim Button OR Notes Indicator Chevron -->
          <div class="task-tab-right-col">
            ${isReadyToClaim
              ? `<button class="task-tab-claim-btn" onclick="claimDailyTaskReward('${task.id}', event)">
                   <span>Claim 🎴</span>
                 </button>`
              : `<div class="task-tab-notes-indicator" title="Tap to view task notes">
                   <span>Notes</span>
                   <svg class="task-tab-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                     <polyline points="9 18 15 12 9 6"/>
                   </svg>
                 </div>`
            }
          </div>

        </div>
      `;
    });
    container.innerHTML = html;

  } else {
    // Telegram Tasks Subtab
    const activeTelegramTasks = TELEGRAM_TASKS.filter(task => !gameState.tasksState.claimedTelegram[task.id]);

    if (tgBadge) {
      tgBadge.textContent = activeTelegramTasks.length;
    }

    if (activeTelegramTasks.length === 0) {
      container.innerHTML = `
        <div class="tasks-empty-complete-card">
          <div class="empty-trophy-icon">✈️</div>
          <h4 class="empty-title">All Telegram Tasks Complete!</h4>
          <p class="empty-desc">You joined all official Telegram channels and bots. Stay tuned for new partner drops!</p>
        </div>
      `;
      return;
    }

    let html = '';
    activeTelegramTasks.forEach(task => {
      const tgSvg = getTaskIconSvg(task.iconType);

      // Telegram Tab: Normal clean decorated structure without liquid fill animation
      html += `
        <div class="task-decorated-tab-card ${task.colorClass}" 
             id="tgCard-${task.id}" 
             onclick="openTaskNotesPopup('${task.id}', 'telegram')" 
             role="button" 
             tabindex="0">

          <!-- Left Accent Bar -->
          <div class="task-tab-accent-bar ${task.accentClass}"></div>

          <!-- 3D Icon Box -->
          <div class="task-tab-icon-box ${task.iconClass}">
            ${tgSvg}
          </div>

          <!-- Title & Subtag -->
          <div class="task-tab-text-info">
            <div class="task-tab-title-row">
              <span class="task-tab-title">${task.title}</span>
              <span class="task-cat-tag ${task.tagClass}">${task.tagText}</span>
            </div>
          </div>

          <!-- Right Action Col -->
          <div class="task-tab-right-col">
            <button class="task-tab-notes-indicator" onclick="joinTelegramTask('${task.id}', '${task.title}', ${task.rewardKeys}, '${task.url}', event)">
              <span>${task.btnText}</span>
              <svg class="task-tab-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

        </div>
      `;
    });
    container.innerHTML = html;
  }
}

// ==========================================================================
// INTERACTIVE TASK NOTES POP-UP MODAL (SHEET)
// ==========================================================================
let currentModalTaskId = null;
let currentModalTaskType = 'daily';

function openTaskNotesPopup(taskId, subtabType = 'daily') {
  currentModalTaskId = taskId;
  currentModalTaskType = subtabType;

  const backdrop = document.getElementById('taskNotesBackdrop');
  if (!backdrop) return;

  let task = null;
  if (subtabType === 'daily') {
    task = DAILY_TASKS.find(t => t.id === taskId);
  } else {
    task = TELEGRAM_TASKS.find(t => t.id === taskId);
  }
  if (!task) return;

  sfx.playTapSound(1);

  // 1. Icon & Header
  const iconWrap = document.getElementById('taskNotesIconWrap');
  if (iconWrap) {
    iconWrap.innerHTML = getTaskIconSvg(task.iconType);
  }

  const subtag = document.getElementById('taskNotesSubtag');
  if (subtag) {
    subtag.textContent = task.tagText || (subtabType === 'daily' ? 'DAILY QUEST' : 'TELEGRAM TASK');
  }

  const title = document.getElementById('taskNotesTitle');
  if (title) {
    title.textContent = task.title;
  }

  // 2. Liquid Progress & Exact Numbers inside Notes Modal
  const progVal = document.getElementById('taskNotesProgVal');
  const progLiquid = document.getElementById('taskNotesProgLiquid');

  let isReadyToClaim = false;
  if (subtabType === 'daily') {
    const currentProgress = getTaskCurrentProgress(task);
    const percent = Math.min(100, Math.floor((currentProgress / task.target) * 100));
    isReadyToClaim = currentProgress >= task.target;

    if (progVal) {
      progVal.textContent = `${currentProgress.toLocaleString()} / ${task.target.toLocaleString()} (${percent}%)`;
    }
    if (progLiquid) {
      progLiquid.style.width = `${percent}%`;
    }
  } else {
    if (progVal) {
      progVal.textContent = '1 Membership Required';
    }
    if (progLiquid) {
      progLiquid.style.width = '50%';
    }
  }

  // 3. Notes Body & Description
  const descEl = document.getElementById('taskNotesDesc');
  if (descEl) {
    descEl.innerHTML = `${task.notes || task.desc} ${task.tip ? `<br><br><span style="color: #38bdf8; font-weight: 700;">💡 ${task.tip}</span>` : ''}`;
  }

  // 4. Reward & Status Tag
  const rewardValEl = document.getElementById('taskNotesRewardVal');
  const rewardIconEl = document.getElementById('taskNotesRewardIcon');
  const statusTag = document.getElementById('taskNotesStatusTag');

  if (rewardValEl) {
    rewardValEl.textContent = task.rewardText || '1 Scratch Card';
  }
  if (rewardIconEl) {
    rewardIconEl.textContent = subtabType === 'daily' ? '🎴' : '🔑';
  }
  if (statusTag) {
    if (isReadyToClaim) {
      statusTag.textContent = 'READY TO CLAIM';
      statusTag.classList.add('ready');
    } else {
      statusTag.textContent = 'IN PROGRESS';
      statusTag.classList.remove('ready');
    }
  }

  // 5. Action Buttons inside Modal
  const actionsWrap = document.getElementById('taskNotesActions');
  if (actionsWrap) {
    if (subtabType === 'daily') {
      if (isReadyToClaim) {
        actionsWrap.innerHTML = `
          <button class="notes-claim-btn" onclick="claimDailyFromNotes('${task.id}')">
            <span>🎉 Claim 1 Scratch Card 🎴</span>
          </button>
        `;
      } else {
        const nav = getTaskNavTarget(task);
        actionsWrap.innerHTML = `
          <button class="notes-nav-btn" onclick="goToTaskFromNotes('${nav.page}')">
            <span>🚀 ${nav.text}</span>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button class="notes-close-action-btn" onclick="closeTaskNotesPopup()">Close</button>
        `;
      }
    } else {
      actionsWrap.innerHTML = `
        <button class="notes-nav-btn" onclick="joinTelegramFromNotes('${task.id}', '${task.title}', ${task.rewardKeys}, '${task.url}')">
          <span>✈️ Open & Claim Key</span>
        </button>
        <button class="notes-close-action-btn" onclick="closeTaskNotesPopup()">Close</button>
      `;
    }
  }

  // Open backdrop
  backdrop.classList.add('open');
}

function closeTaskNotesPopup(event) {
  if (event && event.target && event.target.id !== 'taskNotesBackdrop' && !event.target.classList.contains('task-notes-close-btn')) {
    return;
  }
  const backdrop = document.getElementById('taskNotesBackdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
  }
}

function claimDailyFromNotes(taskId) {
  closeTaskNotesPopup();
  claimDailyTaskReward(taskId);
}

function goToTaskFromNotes(targetPage) {
  closeTaskNotesPopup();
  if (typeof switchPage === 'function') {
    switchPage(targetPage);
  }
}

function joinTelegramFromNotes(taskId, title, rewardKeys, url) {
  closeTaskNotesPopup();
  joinTelegramTask(taskId, title, rewardKeys, url);
}

// Spawns celebratory emoji explosion effect over the card
function spawnTaskEmojiBurst(card) {
  if (!card) return;
  const burstWrap = document.createElement('div');
  burstWrap.className = 'task-emoji-burst-container';
  const emojis = ['🎴', '✨', '🎉', '🌟', '🎴', '💫', '🎁'];
  
  for (let i = 0; i < 9; i++) {
    const particle = document.createElement('span');
    particle.className = 'burst-emoji-particle';
    particle.textContent = emojis[i % emojis.length];
    const tx = (Math.random() - 0.5) * 160;
    const ty = -35 - Math.random() * 75;
    const tr = (Math.random() - 0.5) * 80;
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--tr', `${tr}deg`);
    particle.style.left = `${45 + (Math.random() - 0.5) * 35}%`;
    particle.style.top = '35%';
    burstWrap.appendChild(particle);
  }
  
  card.style.position = 'relative';
  card.appendChild(burstWrap);
}

// Claim Daily Task: Awards 1 Scratch Card, triggers emoji burst, and smoothly removes task tab
function claimDailyTaskReward(taskId, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const task = DAILY_TASKS.find(t => t.id === taskId);
  if (!task) return;

  const executeClaim = () => {
    const card = document.getElementById(`taskCard-${taskId}`);
    
    // 1. Emoji Burst Effect
    spawnTaskEmojiBurst(card);
    sfx.playLevelUpSound();

    // 2. Animate and collapse card
    if (card) {
      card.classList.add('task-claimed-exit');
    }

    // 3. Award 1 Scratch Card
    gameState.tasksState.claimedDaily[taskId] = true;
    gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
    if (gameState.goalState && gameState.goalState.levelProgress) {
      gameState.goalState.levelProgress.cards = (gameState.goalState.levelProgress.cards || 0) + 1;
    }

    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎴 +1 Scratch Card Claimed!');
    }

    // 4. Remove from DOM after smooth collapse
    setTimeout(() => {
      updateUI();
      renderTasksList();
      saveGame();
    }, 420);
  };

  if (typeof showRewardedAd === 'function') {
    showRewardedAd(executeClaim);
  } else {
    executeClaim();
  }
}

// Join Telegram Task: opens link, awards Keys, bursts emojis, and smoothly removes task tab
function joinTelegramTask(taskId, title, rewardKeys, url, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const card = document.getElementById(`tgCard-${taskId}`);
  
  spawnTaskEmojiBurst(card);
  sfx.playLevelUpSound();

  if (card) {
    card.classList.add('task-claimed-exit');
  }

  if (url) window.open(url, '_blank');

  gameState.tasksState.claimedTelegram[taskId] = true;
  gameState.player.websiteTasksCompleted = (gameState.player.websiteTasksCompleted || 0) + 1;
  gameState.player.chestKeys = (gameState.player.chestKeys || 0) + rewardKeys;
  gameState.goal.currentKeys = Math.min(gameState.goal.targetKeys, (gameState.goal.currentKeys || 0) + rewardKeys);

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🔑 +${rewardKeys} Key${rewardKeys === 1 ? '' : 's'} Claimed!`);
  }

  setTimeout(() => {
    updateUI();
    renderTasksList();
    saveGame();
  }, 420);
}

// Global Exports
window.DAILY_TASKS = DAILY_TASKS;
window.TELEGRAM_TASKS = TELEGRAM_TASKS;
window.switchTaskSubtab = switchTaskSubtab;
window.renderTasksList = renderTasksList;
window.claimDailyTaskReward = claimDailyTaskReward;
window.joinTelegramTask = joinTelegramTask;
window.openTaskNotesPopup = openTaskNotesPopup;
window.closeTaskNotesPopup = closeTaskNotesPopup;
window.claimDailyFromNotes = claimDailyFromNotes;
window.goToTaskFromNotes = goToTaskFromNotes;
window.joinTelegramFromNotes = joinTelegramFromNotes;

// Pre-render tasks list on DOM ready for instant fast loading
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof renderTasksList === 'function') renderTasksList();
    });
  } else {
    setTimeout(() => {
      if (typeof renderTasksList === 'function') renderTasksList();
    }, 0);
  }
}
