/* ==========================================================================
   ENERGY TAP REACTOR - TASKS & QUESTS (pages/tasks/tasks.js)
   - Fixed Uniform Tab Size (58px Height, styled like Mega Reward page)
   - Numeric present value text removed from the tab card
   - Left-to-right animated Water / Liquid Color Fill based on progress value
   - Interactive Task Notes Pop-Up Modal on tab click
   - 1 Scratch Card Reward for all Daily Tasks & Emoji Burst Animation
   ========================================================================== */

const MONTHLY_TASKS = [
  {
    id: 'd1',
    number: 1,
    title: '1. Tap 2,000 Times',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Tap the central orb 2,000 times on the Home page to win 1 Scratch Card',
    notes: 'Tap the glowing central reactor orb on the Home screen to accumulate energy taps during the 30-day competition cycle. Each tap powers up your reactor core and advances toward completing this quest.',
    tip: 'Tip: Tap with multiple fingers simultaneously to hit 2,000 taps rapidly!',
    type: 'tap',
    target: 2000,
    iconType: 'lightning',
    colorClass: 'task-cyan',
    iconClass: 'task-icon-cyan',
    accentClass: 'task-tab-accent-cyan',
    liquidTheme: 'liquid-cyan',
    tagClass: 'tag-cyan',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd2',
    number: 2,
    title: '2. Tap 5,000 Times',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Reach 5,000 total taps on the central orb to win 1 Scratch Card',
    notes: 'Generate 5,000 total taps on the Home screen reactor during the month. Continuous tapping fills your reactor pressure gauge and unlocks bonus energy.',
    tip: 'Tip: Keep energy regeneration high to sustain long tapping sessions.',
    type: 'tap',
    target: 5000,
    iconType: 'lightning',
    colorClass: 'task-blue',
    iconClass: 'task-icon-blue',
    accentClass: 'task-tab-accent-blue',
    liquidTheme: 'liquid-blue',
    tagClass: 'tag-blue',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd3',
    number: 3,
    title: '3. Tap 10,000 Times',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Harvest 10,000 taps on the central orb to win 1 Scratch Card',
    notes: 'Master your reactor tapping power by completing 10,000 taps in the 30-day competition cycle. Achieving this major monthly quest proves your dedication to the empire.',
    tip: 'Tip: Unlock higher reactor tiers to maximize the value of every single tap.',
    type: 'tap',
    target: 10000,
    iconType: 'lightning',
    colorClass: 'task-green',
    iconClass: 'task-icon-green',
    accentClass: 'task-tab-accent-green',
    liquidTheme: 'liquid-green',
    tagClass: 'tag-green',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_green',
    number: 4,
    title: '4. Use 2,000 Green Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 2,000 Green Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Navigate to the Energy Generator page and use 2,000 Green Fuel cells to power your passive energy turbines and keep them spinning continuously this month.',
    tip: 'Tip: Claim Green Fuel from ad stations or wheel spins to keep your generator loaded.',
    type: 'fuel_green',
    target: 2000,
    iconType: 'pump',
    colorClass: 'task-green',
    iconClass: 'task-icon-green',
    accentClass: 'task-tab-accent-green',
    liquidTheme: 'liquid-green',
    tagClass: 'tag-green',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_yellow_1',
    number: 5,
    title: '5. Use 1,000 Yellow Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 1,000 Yellow Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 1,000 high-density Yellow Fuel cells in the Energy Generator to accelerate your passive energy income during the 30-day cycle.',
    tip: 'Tip: Yellow fuel delivers strong output boosts for high-performance reactors.',
    type: 'fuel_yellow',
    target: 1000,
    iconType: 'pump',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_yellow_2',
    number: 6,
    title: '6. Use 2,000 Yellow Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 2,000 Yellow Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 2,000 Yellow Fuel cells in the Energy Generator during the 30-day competition. Sustained fuel injection ensures uninterrupted reactor power.',
    tip: 'Tip: Keep all fuel chambers loaded to maximize your progression.',
    type: 'fuel_yellow',
    target: 2000,
    iconType: 'pump',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_orange',
    number: 7,
    title: '7. Use 1,000 Orange Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 1,000 Orange Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 1,000 supercharged Orange Fuel cells in the Energy Generator to fire up maximum thermal energy.',
    tip: 'Tip: Orange fuel provides an exceptional power boost for passive EP generation.',
    type: 'fuel_orange',
    target: 1000,
    iconType: 'pump',
    colorClass: 'task-orange',
    iconClass: 'task-icon-orange',
    accentClass: 'task-tab-accent-orange',
    liquidTheme: 'liquid-orange',
    tagClass: 'tag-orange',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_red',
    number: 8,
    title: '8. Use 1,000 Red Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 1,000 Red Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Consume 1,000 ultra-potent Red Fuel cells in the Energy Generator to push your turbines to maximum overclock.',
    tip: 'Tip: Red Fuel provides permanent EP/sec rate increases upon usage.',
    type: 'fuel_red',
    target: 1000,
    iconType: 'pump',
    colorClass: 'task-red',
    iconClass: 'task-icon-red',
    accentClass: 'task-tab-accent-red',
    liquidTheme: 'liquid-red',
    tagClass: 'tag-red',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_pink',
    number: 9,
    title: '9. Use 500 Pink Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 500 Pink Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Use 500 Pink Fuel cells in the Energy Generator to trigger the 2x Energy Booster overdrive.',
    tip: 'Tip: Pink boost doubles your passive EP earnings while active.',
    type: 'fuel_pink',
    target: 500,
    iconType: 'pump',
    colorClass: 'task-pink',
    iconClass: 'task-icon-pink',
    accentClass: 'task-tab-accent-pink',
    liquidTheme: 'liquid-pink',
    tagClass: 'tag-pink',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_fuel_purple',
    number: 10,
    title: '10. Use 250 Purple Fuel',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Consume 250 Purple Fuel cells in the Energy Generator to win 1 Scratch Card',
    notes: 'Use 250 Purple Fuel cells in the Energy Generator to trigger the 5x Energy Booster hyperdrive.',
    tip: 'Tip: Purple boost generates a massive 5x surge in generator production.',
    type: 'fuel_purple',
    target: 250,
    iconType: 'pump',
    colorClass: 'task-purple',
    iconClass: 'task-icon-purple',
    accentClass: 'task-tab-accent-purple',
    liquidTheme: 'liquid-purple',
    tagClass: 'tag-purple',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_spin_250',
    number: 11,
    title: '11. Spin 250 in 30 days',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Spin the Lucky Wheel 250 times in 30 days to win 1 Scratch Card',
    notes: 'Spin the Lucky Prize Wheel 250 times in this 30-day competition cycle. Every spin gives you a chance to win keys, tickets, fuel cells, and huge jackpot coin prizes.',
    tip: 'Tip: If tickets run low, watch a quick ad to claim free tickets instantly.',
    type: 'spin',
    target: 250,
    iconType: 'spin',
    colorClass: 'task-purple',
    iconClass: 'task-icon-purple',
    accentClass: 'task-tab-accent-purple',
    liquidTheme: 'liquid-purple',
    tagClass: 'tag-purple',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_chest_250',
    number: 12,
    title: '12. Chest play 250 in 30 days',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Unlock and open 250 Mystery Chests in 30 days to win 1 Scratch Card',
    notes: 'Unlock 250 Mystery Chests using Winning Keys during this 30-day competition. Pick any chest to reveal hidden rewards and rare fuel.',
    tip: 'Tip: Earn keys from Telegram tasks or claim free keys via video ads.',
    type: 'chest',
    target: 250,
    iconType: 'chest',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_scratch_200',
    number: 13,
    title: '13. Card scratch 200 in 30 days',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Play and scratch 200 Scratch Cards in 30 days to win 1 Scratch Card',
    notes: 'Scratch away the metallic gray foil on 200 holographic cards during the 30-day competition cycle to reveal instant prizes!',
    tip: 'Tip: Rub or tap the card foil to reveal hidden reward items.',
    type: 'scratch',
    target: 200,
    iconType: 'scratch',
    colorClass: 'task-pink',
    iconClass: 'task-icon-pink',
    accentClass: 'task-tab-accent-pink',
    liquidTheme: 'liquid-pink',
    tagClass: 'tag-pink',
    tagText: 'MONTHLY QUEST'
  },
  {
    id: 'd_egg_300',
    number: 14,
    title: '14. Egg coin use in egg game 300 in 30 days',
    rewardText: '1 Scratch Card',
    rewardType: 'scratch_card',
    rewardVal: 1,
    desc: 'Use 300 Egg Coins in Cyber Egg Hatchery in 30 days to win 1 Scratch Card',
    notes: 'Hatch Cyber Eggs using 300 Egg Coins in the 16-Egg Hatchery during this 30-day competition cycle. Collect 3 matching items to win big!',
    tip: 'Tip: Claim free egg coins by watching video ads or earning them in chests.',
    type: 'egg',
    target: 300,
    iconType: 'egg',
    colorClass: 'task-green',
    iconClass: 'task-icon-green',
    accentClass: 'task-tab-accent-green',
    liquidTheme: 'liquid-green',
    tagClass: 'tag-green',
    tagText: 'MONTHLY QUEST'
  }
];

// Backwards compatibility alias
const DAILY_TASKS = MONTHLY_TASKS;

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

const WEBSITE_TASKS = [
  {
    id: 'web1',
    title: 'Visit: Tap Empire Official Web',
    rewardText: '100 Diamonds 💎',
    diamondReward: 100,
    costCoins: 1000,
    code: '4829',
    desc: 'Unlock with 1,000 Coins, visit official portal, and enter 4-digit secret code to win 100 Diamonds 💎',
    notes: 'Spend 1,000 Coins to open Tap Empire official website. Search the page for the hidden 4-digit PIN code. Enter the code to claim 100 Diamonds! Wrong code removes the quest.',
    tip: 'Tip: Look carefully at the banner or footer on the webpage for your 4-digit PIN code.',
    iconType: 'globe',
    btnText: 'Unlock & Visit',
    url: 'https://tapempire.io',
    colorClass: 'task-cyan',
    iconClass: 'task-icon-cyan',
    accentClass: 'task-tab-accent-cyan',
    liquidTheme: 'liquid-cyan',
    tagClass: 'tag-cyan',
    tagText: 'SPONSOR QUEST'
  },
  {
    id: 'web2',
    title: 'Visit Partner: CoinMarketCap Hub',
    rewardText: '150 Diamonds 💎',
    diamondReward: 150,
    costCoins: 1000,
    code: '7105',
    desc: 'Unlock with 1,000 Coins, explore partner hub, and enter 4-digit code to win 150 Diamonds 💎',
    notes: 'Spend 1,000 Coins to unlock partner site. Browse through the verified hub to find the 4-digit secret key. Accurate verification awards 150 Diamonds!',
    tip: 'Tip: Copy or memorize the 4 numbers before returning to the game.',
    iconType: 'globe',
    btnText: 'Unlock & Visit',
    url: 'https://coinmarketcap.com',
    colorClass: 'task-blue',
    iconClass: 'task-icon-blue',
    accentClass: 'task-tab-accent-blue',
    liquidTheme: 'liquid-blue',
    tagClass: 'tag-blue',
    tagText: 'PARTNER QUEST'
  },
  {
    id: 'web3',
    title: 'Visit: Airdrop & Rewards Directory',
    rewardText: '200 Diamonds 💎',
    diamondReward: 200,
    costCoins: 1000,
    code: '9364',
    desc: 'Unlock with 1,000 Coins, explore Web3 directory, and enter 4-digit code to win 200 Diamonds 💎',
    notes: 'Unlock exclusive rewards portal for 1,000 Coins. Locate the 4-digit authorization code and enter it to win 200 Diamonds!',
    tip: 'Tip: If code is entered incorrectly, the task is eliminated and you must try again.',
    iconType: 'globe',
    btnText: 'Unlock & Visit',
    url: 'https://dappradar.com',
    colorClass: 'task-purple',
    iconClass: 'task-icon-purple',
    accentClass: 'task-tab-accent-purple',
    liquidTheme: 'liquid-purple',
    tagClass: 'tag-purple',
    tagText: 'EXCLUSIVE QUEST'
  }
];

function getWebsiteTasksList() {
  if (window.cloudWebsiteTasks && Array.isArray(window.cloudWebsiteTasks) && window.cloudWebsiteTasks.length > 0) {
    return window.cloudWebsiteTasks.map(ct => {
      const def = WEBSITE_TASKS.find(dt => dt.id === ct.id) || {};
      return {
        ...def,
        ...ct,
        costCoins: ct.costCoins !== undefined ? ct.costCoins : 1000,
        diamondReward: ct.diamondReward !== undefined ? ct.diamondReward : (def.diamondReward || 100),
        code: ct.code || def.code || '1234',
        rewardText: `${ct.diamondReward !== undefined ? ct.diamondReward : (def.diamondReward || 100)} Diamonds 💎`,
        tagText: ct.tag || def.tagText || 'SPONSOR QUEST'
      };
    });
  }
  return WEBSITE_TASKS;
}

function getTelegramTasksList() {
  if (window.cloudTelegramTasks && Array.isArray(window.cloudTelegramTasks) && window.cloudTelegramTasks.length > 0) {
    return window.cloudTelegramTasks.map(ct => {
      const def = TELEGRAM_TASKS.find(dt => dt.id === ct.id) || {};
      const isBot = ct.iconType === 'bot' || (ct.tagText && ct.tagText.includes('BOT'));
      const keys = ct.rewardKeys !== undefined ? Number(ct.rewardKeys) : (def.rewardKeys || 1);
      return {
        ...def,
        ...ct,
        rewardKeys: keys,
        rewardText: ct.rewardText || `${keys} ${keys > 1 ? 'Keys' : 'Key'} for Chest`,
        colorClass: def.colorClass || 'task-blue',
        iconClass: def.iconClass || 'task-icon-blue',
        accentClass: def.accentClass || 'task-tab-accent-blue',
        liquidTheme: def.liquidTheme || 'liquid-blue',
        tagClass: def.tagClass || 'tag-blue',
        tagText: ct.tagText || (isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL'),
        desc: ct.desc || `Join ${ct.title} on Telegram to win ${keys} Chest Key`,
        notes: ct.notes || `Join and follow instructions to claim your ${keys} Mystery Chest Key reward!`,
        tip: ct.tip || 'Tip: Tap the button below to launch Telegram directly.',
        btnText: ct.btnText || 'Join'
      };
    });
  }
  return TELEGRAM_TASKS;
}

// Subtab Switcher
function switchTaskSubtab(subtabName) {
  gameState.taskSubtab = subtabName;
  const subDaily = (DOM && DOM.subtabDaily) || document.getElementById('subtabDaily');
  const subTelegram = (DOM && DOM.subtabTelegram) || document.getElementById('subtabTelegram');
  const subWebsite = (DOM && DOM.subtabWebsite) || document.getElementById('subtabWebsite');
  
  if (subDaily) subDaily.classList.toggle('active', subtabName === 'daily');
  if (subTelegram) subTelegram.classList.toggle('active', subtabName === 'telegram');
  if (subWebsite) subWebsite.classList.toggle('active', subtabName === 'website');

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
  } else if (iconType === 'globe') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
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
  if (typeof checkDailyStatsDate === 'function') checkDailyStatsDate();
  if (!gameState.dailyStats) {
    gameState.dailyStats = {};
  }
  if (task.type === 'tap') {
    return gameState.dailyStats.taps || gameState.reactor.energyTaps || 0;
  } else if (task.type === 'fuel_green') {
    return gameState.dailyStats.fuel_green || (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.green) || 0;
  } else if (task.type === 'fuel_yellow') {
    return gameState.dailyStats.fuel_yellow || (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.yellow) || 0;
  } else if (task.type === 'fuel_orange') {
    return gameState.dailyStats.fuel_orange || (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.orange) || 0;
  } else if (task.type === 'fuel_red') {
    return gameState.dailyStats.fuel_red || (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.red) || 0;
  } else if (task.type === 'fuel_pink') {
    return gameState.dailyStats.fuel_pink || (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.pink) || 0;
  } else if (task.type === 'fuel_purple') {
    return gameState.dailyStats.fuel_purple || (gameState.energyGenerator && gameState.energyGenerator.consumed && gameState.energyGenerator.consumed.purple) || 0;
  } else if (task.type === 'spin') {
    return gameState.dailyStats.spins || 0;
  } else if (task.type === 'chest') {
    return gameState.dailyStats.chests || 0;
  } else if (task.type === 'scratch') {
    return gameState.dailyStats.scratches || 0;
  } else if (task.type === 'egg') {
    return gameState.dailyStats.eggs || 0;
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
    gameState.tasksState = { claimedDaily: {}, claimedTelegram: {}, claimedWebsite: {} };
  }
  if (!gameState.tasksState.claimedDaily) gameState.tasksState.claimedDaily = {};
  if (!gameState.tasksState.claimedTelegram) gameState.tasksState.claimedTelegram = {};
  if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};

  const dailyBadge = (DOM && DOM.dailyBadgeCount) || document.getElementById('dailyBadgeCount');
  const tgBadge = (DOM && DOM.telegramBadgeCount) || document.getElementById('telegramBadgeCount');
  const webBadge = (DOM && DOM.websiteBadgeCount) || document.getElementById('websiteBadgeCount');

  if (!gameState.tasksState.failedWebsite) gameState.tasksState.failedWebsite = {};
  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};

  const allWebsiteTasks = getWebsiteTasksList();
  const allTelegramTasks = getTelegramTasksList();
  const activeDailyTasks = DAILY_TASKS.filter(task => !gameState.tasksState.claimedDaily[task.id]);
  const activeTelegramTasks = allTelegramTasks.filter(task => !gameState.tasksState.claimedTelegram[task.id]);
  const activeWebsiteTasks = allWebsiteTasks.filter(task => 
    !gameState.tasksState.claimedWebsite[task.id] && !gameState.tasksState.failedWebsite[task.id]
  );

  if (dailyBadge) {
    dailyBadge.textContent = activeDailyTasks.length;
  }
  if (tgBadge) {
    tgBadge.textContent = activeTelegramTasks.length;
  }
  if (webBadge) {
    webBadge.textContent = activeWebsiteTasks.length;
  }

  // Update 30-day competition cycle timer display
  updateMonthlyCompetitionTimer();

  if (gameState.taskSubtab === 'daily') {
    if (activeDailyTasks.length === 0) {
      container.innerHTML = `
        <div class="tasks-empty-complete-card">
          <div class="empty-trophy-icon">🏆</div>
          <h4 class="empty-title">All Monthly Tasks Complete!</h4>
          <p class="empty-desc">You claimed all Scratch Cards for this 30-day competition cycle! New cycle will start when timer resets.</p>
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

  } else if (gameState.taskSubtab === 'telegram') {
    // Telegram Tasks Subtab
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

  } else {
    // Website Tasks Subtab (1,000 Coin unlock, 4-digit code verification, win Diamonds or eliminated)
    if (activeWebsiteTasks.length === 0) {
      container.innerHTML = `
        <div class="tasks-empty-complete-card">
          <div class="empty-trophy-icon">🌐</div>
          <h4 class="empty-title">All Website Quests Complete!</h4>
          <p class="empty-desc">You explored all available sponsor website quests. Any finished or eliminated tasks have been removed. Check back soon for new campaigns!</p>
        </div>
      `;
      return;
    }

    let html = '';
    activeWebsiteTasks.forEach(task => {
      const webSvg = getTaskIconSvg(task.iconType);
      const isAlreadyOpened = gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[task.id];
      const actionBtnLabel = isAlreadyOpened ? 'Enter PIN 🔑' : 'Open (1K 🪙)';

      html += `
        <div class="task-decorated-tab-card ${task.colorClass}" 
             id="webCard-${task.id}" 
             onclick="openTaskNotesPopup('${task.id}', 'website')" 
             role="button" 
             tabindex="0">

          <!-- Left Accent Bar -->
          <div class="task-tab-accent-bar ${task.accentClass}"></div>

          <!-- 3D Icon Box -->
          <div class="task-tab-icon-box ${task.iconClass}">
            ${webSvg}
          </div>

          <!-- Title & Subtag -->
          <div class="task-tab-text-info">
            <div class="task-tab-title-row">
              <span class="task-tab-title">${task.title}</span>
              <span class="task-cat-tag ${task.tagClass}">${task.tagText}</span>
            </div>
            <div style="font-size: 10px; color: #38bdf8; font-weight: 700; margin-top: 1px;">
              Win +${task.diamondReward || 100} 💎 <span style="color: #facc15;">(Cost: 1,000 🪙)</span>
            </div>
          </div>

          <!-- Right Action Col -->
          <div class="task-tab-right-col">
            <button class="task-tab-notes-indicator" onclick="startWebsiteTask('${task.id}', event)">
              <span>${actionBtnLabel}</span>
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
  } else if (subtabType === 'telegram') {
    task = getTelegramTasksList().find(t => t.id === taskId);
  } else {
    task = getWebsiteTasksList().find(t => t.id === taskId);
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
    subtag.textContent = task.tagText || (subtabType === 'daily' ? 'DAILY QUEST' : subtabType === 'telegram' ? 'TELEGRAM TASK' : 'WEBSITE TASK');
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
  } else if (subtabType === 'telegram') {
    if (progVal) {
      progVal.textContent = '1 Membership Required';
    }
    if (progLiquid) {
      progLiquid.style.width = '50%';
    }
  } else {
    const isAlreadyOpened = gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[task.id];
    if (progVal) {
      progVal.textContent = isAlreadyOpened ? 'Unlocked (Enter 4-Digit PIN)' : '1,000 Coins Unlock Required';
    }
    if (progLiquid) {
      progLiquid.style.width = isAlreadyOpened ? '80%' : '25%';
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
    if (subtabType === 'website') {
      rewardValEl.textContent = `+${task.diamondReward || 100} Diamonds`;
    } else {
      rewardValEl.textContent = task.rewardText || '1 Scratch Card';
    }
  }
  if (rewardIconEl) {
    rewardIconEl.textContent = subtabType === 'daily' ? '🎴' : (subtabType === 'website' ? '💎' : '🔑');
  }
  if (statusTag) {
    if (subtabType === 'website') {
      const isAlreadyOpened = gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[task.id];
      statusTag.textContent = isAlreadyOpened ? 'UNLOCKED (PIN READY)' : '1,000 COIN COST';
      statusTag.className = 'reward-ready-tag ' + (isAlreadyOpened ? 'ready' : '');
    } else if (isReadyToClaim) {
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
    } else if (subtabType === 'telegram') {
      actionsWrap.innerHTML = `
        <button class="notes-nav-btn" onclick="joinTelegramFromNotes('${task.id}', '${task.title}', ${task.rewardKeys}, '${task.url}')">
          <span>✈️ Open & Claim Key</span>
        </button>
        <button class="notes-close-action-btn" onclick="closeTaskNotesPopup()">Close</button>
      `;
    } else {
      const isAlreadyOpened = gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[task.id];
      const btnIcon = isAlreadyOpened ? '🔑' : '🌐';
      const btnTitle = isAlreadyOpened ? 'Enter Secret 4-Digit Code' : 'Open Website (1,000 🪙)';
      actionsWrap.innerHTML = `
        <button class="notes-nav-btn" onclick="visitWebsiteFromNotes('${task.id}')" style="background: linear-gradient(135deg, #06b6d4 0%, #2563eb 100%);">
          <span>${btnIcon} ${btnTitle}</span>
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

function visitWebsiteFromNotes(taskId) {
  closeTaskNotesPopup();
  startWebsiteTask(taskId);
}

// ==========================================================================
// WEBSITE QUEST CONTROLLER (1,000 COIN COST, 4-DIGIT PIN & DIAMONDS REWARD)
// ==========================================================================
let activeVerifyingTaskId = null;

function startWebsiteTask(taskId, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const allWebsiteTasks = getWebsiteTasksList();
  const task = allWebsiteTasks.find(t => t.id === taskId);
  if (!task) return;

  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  const isAlreadyOpened = gameState.tasksState.openedWebsite[taskId];

  // If already opened, directly open PIN verification modal without charging coins again
  if (isAlreadyOpened) {
    openWebCodeModal(taskId);
    return;
  }

  // Check if player has 1,000 Coins
  const cost = task.costCoins !== undefined ? task.costCoins : 1000;
  if ((gameState.player.coins || 0) < cost) {
    sfx.playErrorSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚠️ Insufficient Coins! Need ${cost.toLocaleString()} 🪙 to open task.`);
    } else {
      alert(`Insufficient Coins! You need ${cost.toLocaleString()} Coins to open this website quest.`);
    }
    return;
  }

  // Deduct 1,000 Coins
  gameState.player.coins -= cost;
  gameState.tasksState.openedWebsite[taskId] = true;
  saveGame();
  updateUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🪙 -${cost.toLocaleString()} Coins paid to open quest!`);
  }
  sfx.playBuySound();

  // Open the website link in a new browser tab
  if (task.url) {
    window.open(task.url, '_blank');
  }

  // Render updated button label ("Enter PIN 🔑")
  renderTasksList();

  // Open the 4-digit code verification modal
  setTimeout(() => {
    openWebCodeModal(taskId);
  }, 400);
}

function openWebCodeModal(taskId) {
  const allWebsiteTasks = getWebsiteTasksList();
  const task = allWebsiteTasks.find(t => t.id === taskId);
  if (!task) return;

  activeVerifyingTaskId = taskId;

  const backdrop = document.getElementById('webCodeModalBackdrop');
  const titleEl = document.getElementById('webModalTitle');
  const rewardEl = document.getElementById('webModalRewardText');
  const subtagEl = document.getElementById('webModalSubtag');

  if (titleEl) titleEl.textContent = task.title;
  if (rewardEl) rewardEl.textContent = `+${task.diamondReward || 100} Diamonds 💎`;
  if (subtagEl) subtagEl.textContent = task.tagText || 'WEBSITE QUEST VERIFICATION';

  // Clear 4 inputs
  for (let i = 0; i < 4; i++) {
    const pinInp = document.getElementById(`webPin${i}`);
    if (pinInp) pinInp.value = '';
  }

  setupPinInputAutoAdvance();

  if (backdrop) backdrop.classList.add('open');
  const firstPin = document.getElementById('webPin0');
  if (firstPin) setTimeout(() => firstPin.focus(), 150);
}

function closeWebCodeModal(event) {
  if (event && event.target && event.target.id !== 'webCodeModalBackdrop' && !event.target.classList.contains('web-code-close-btn')) {
    return;
  }
  const backdrop = document.getElementById('webCodeModalBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function revisitWebsiteTaskUrl() {
  if (!activeVerifyingTaskId) return;
  const allWebsiteTasks = getWebsiteTasksList();
  const task = allWebsiteTasks.find(t => t.id === activeVerifyingTaskId);
  if (task && task.url) {
    window.open(task.url, '_blank');
  }
}

function setupPinInputAutoAdvance() {
  for (let i = 0; i < 4; i++) {
    const pinInp = document.getElementById(`webPin${i}`);
    if (!pinInp) continue;

    pinInp.oninput = (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val ? val[0] : '';
      if (val && i < 3) {
        const next = document.getElementById(`webPin${i + 1}`);
        if (next) next.focus();
      }
    };

    pinInp.onkeydown = (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        const prev = document.getElementById(`webPin${i - 1}`);
        if (prev) prev.focus();
      } else if (e.key === 'Enter') {
        submitWebsiteCodeVerification();
      }
    };
  }
}

function submitWebsiteCodeVerification() {
  if (!activeVerifyingTaskId) return;

  const taskId = activeVerifyingTaskId;
  const allWebsiteTasks = getWebsiteTasksList();
  const task = allWebsiteTasks.find(t => t.id === taskId);
  if (!task) return;

  let enteredCode = '';
  for (let i = 0; i < 4; i++) {
    const inp = document.getElementById(`webPin${i}`);
    enteredCode += (inp ? inp.value.trim() : '');
  }

  if (enteredCode.length < 4) {
    sfx.playErrorSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Please enter the full 4-digit code!');
    }
    return;
  }

  // Close verification modal
  const codeBackdrop = document.getElementById('webCodeModalBackdrop');
  if (codeBackdrop) codeBackdrop.classList.remove('open');

  const correctCode = (task.code || '1234').toString().trim();
  const card = document.getElementById(`webCard-${taskId}`);

  if (enteredCode === correctCode) {
    // SUCCESS: Correct Code -> Win Diamonds & Remove Task
    const winDiamonds = task.diamondReward || 100;
    
    if (!gameState.tasksState.claimedWebsite) gameState.tasksState.claimedWebsite = {};
    gameState.tasksState.claimedWebsite[taskId] = true;
    gameState.player.diamonds = (gameState.player.diamonds || 0) + winDiamonds;
    gameState.player.websiteTasksCompleted = (gameState.player.websiteTasksCompleted || 0) + 1;

    if (card) {
      spawnTaskEmojiBurst(card);
      card.classList.add('task-claimed-exit');
    }

    sfx.playLevelUpSound();
    saveGame();
    updateUI();

    showWebResultModal(true, winDiamonds, `Correct code (${correctCode}) verified! You earned ${winDiamonds} Diamonds. Task completed and removed.`);
  } else {
    // FAILURE: Incorrect Code -> Remove Task and show "Try Again" popup
    if (!gameState.tasksState.failedWebsite) gameState.tasksState.failedWebsite = {};
    gameState.tasksState.failedWebsite[taskId] = true;

    if (card) {
      card.classList.add('task-claimed-exit');
    }

    sfx.playErrorSound();
    saveGame();
    updateUI();

    showWebResultModal(false, 0, `Invalid 4-digit code entered (${enteredCode}). Task removed without reward. Please try again with new quests!`);
  }

  // Re-render tasks list after smooth exit animation
  setTimeout(() => {
    renderTasksList();
  }, 420);
}

function showWebResultModal(isSuccess, diamondReward, message) {
  const backdrop = document.getElementById('webResultModalBackdrop');
  const glow = document.getElementById('webResultGlow');
  const icon = document.getElementById('webResultIcon');
  const title = document.getElementById('webResultTitle');
  const desc = document.getElementById('webResultDesc');
  const rewardBadge = document.getElementById('webResultRewardBadge');
  const rewardVal = document.getElementById('webResultRewardVal');

  if (!backdrop) return;

  if (isSuccess) {
    if (glow) {
      glow.className = 'web-result-glow glow-success';
    }
    if (icon) icon.textContent = '💎';
    if (title) title.textContent = 'Quest Completed! 💎';
    if (desc) desc.textContent = message || `Congratulations! You unlocked the secret code and won ${diamondReward} Diamonds!`;
    if (rewardBadge) {
      rewardBadge.className = 'web-result-reward-badge';
      rewardBadge.style.display = 'block';
    }
    if (rewardVal) rewardVal.textContent = `+${diamondReward} Diamonds 💎`;
  } else {
    if (glow) {
      glow.className = 'web-result-glow glow-failure';
    }
    if (icon) icon.textContent = '❌';
    if (title) title.textContent = 'Wrong Code - Try Again!';
    if (desc) desc.textContent = message || 'The 4-digit code you entered did not match. Task has been removed.';
    if (rewardBadge) {
      rewardBadge.className = 'web-result-reward-badge badge-failed';
      rewardBadge.style.display = 'block';
    }
    if (rewardVal) rewardVal.textContent = 'Task Removed (0 💎)';
  }

  backdrop.classList.add('open');
}

function closeWebResultModal(event) {
  if (event && event.target && event.target.id !== 'webResultModalBackdrop' && event.target.tagName !== 'BUTTON') {
    return;
  }
  const backdrop = document.getElementById('webResultModalBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

// Global Exports
window.DAILY_TASKS = DAILY_TASKS;
window.TELEGRAM_TASKS = TELEGRAM_TASKS;
window.WEBSITE_TASKS = WEBSITE_TASKS;
window.getWebsiteTasksList = getWebsiteTasksList;
window.getTelegramTasksList = getTelegramTasksList;
window.switchTaskSubtab = switchTaskSubtab;
window.renderTasksList = renderTasksList;
window.claimDailyTaskReward = claimDailyTaskReward;
window.joinTelegramTask = joinTelegramTask;
window.startWebsiteTask = startWebsiteTask;
window.openWebCodeModal = openWebCodeModal;
window.closeWebCodeModal = closeWebCodeModal;
window.revisitWebsiteTaskUrl = revisitWebsiteTaskUrl;
window.submitWebsiteCodeVerification = submitWebsiteCodeVerification;
window.showWebResultModal = showWebResultModal;
window.closeWebResultModal = closeWebResultModal;
window.openTaskNotesPopup = openTaskNotesPopup;
window.closeTaskNotesPopup = closeTaskNotesPopup;
window.claimDailyFromNotes = claimDailyFromNotes;
window.goToTaskFromNotes = goToTaskFromNotes;
window.joinTelegramFromNotes = joinTelegramFromNotes;
window.visitWebsiteFromNotes = visitWebsiteFromNotes;

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
    if (!gameState.tasksState.claimedMonthly) gameState.tasksState.claimedMonthly = {};
    gameState.tasksState.claimedMonthly[taskId] = true;
    gameState.player.scratchCards = (gameState.player.scratchCards || 0) + 1;
    gameState.player.chestTickets = (gameState.player.chestTickets || 0) + 1;
    if (gameState.goalState && gameState.goalState.levelProgress) {
      gameState.goalState.levelProgress.cards = (gameState.goalState.levelProgress.cards || 0) + 1;
    }

    if (typeof showFloatingToast === 'function') {
      showFloatingToast('🎴 +1 Scratch Card Claimed!');
    }

    // 4. Remove from DOM after smooth collapse & sync to Firebase immediately
    setTimeout(() => {
      updateUI();
      renderTasksList();
      saveGame();
      if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
        window.firebaseSync.saveToCloudImmediate();
      }
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

  const allTelegramTasks = getTelegramTasksList();
  const task = allTelegramTasks.find(t => t.id === taskId);
  if (!task) return;

  // Open the Telegram link
  if (url) {
    window.open(url, '_blank');
  }

  const card = document.getElementById(`tgCard-${taskId}`);
  spawnTaskEmojiBurst(card);
  sfx.playLevelUpSound();

  if (card) {
    card.classList.add('task-claimed-exit');
  }

  // Award Keys
  const keysCount = rewardKeys || 1;
  gameState.tasksState.claimedTelegram[taskId] = true;
  gameState.player.chestKeys = (gameState.player.chestKeys || 0) + keysCount;
  if (gameState.goalState && gameState.goalState.levelProgress) {
    gameState.goalState.levelProgress.keys = (gameState.goalState.levelProgress.keys || 0) + keysCount;
  }

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🔑 +${keysCount} Key Claimed!`);
  }

  setTimeout(() => {
    updateUI();
    renderTasksList();
    saveGame();
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
  }, 420);
}

// Auto-initialize when Tasks Page renders
if (typeof window !== 'undefined') {
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

// 30-Day Monthly Tasks Competition Countdown Timer (Firebase Backend Synced)
function updateMonthlyCompetitionTimer() {
  const timerEl = document.getElementById('monthlyCompetitionTimer');
  if (!timerEl) return;

  const now = Date.now();
  let remainingMs = 0;

  // 1. Check if Firebase Cloud backend competition cycle timestamp is loaded
  if (gameState.monthlyCompetition && gameState.monthlyCompetition.endTime) {
    remainingMs = Math.max(0, gameState.monthlyCompetition.endTime - now);
  } else {
    // 2. Check cached localStorage from Firebase
    try {
      const cached = JSON.parse(localStorage.getItem('ENERGY_TAP_MONTHLY_COMPETITION') || 'null');
      if (cached && cached.endTime) {
        remainingMs = Math.max(0, cached.endTime - now);
      }
    } catch (e) {}

    // 3. Fallback to local 30-day cycle
    if (!remainingMs) {
      const cycleMs = (typeof MONTHLY_RESET_CYCLE_MS !== 'undefined') ? MONTHLY_RESET_CYCLE_MS : (30 * 24 * 60 * 60 * 1000);
      const resetTimestamp = (gameState.dailyStats && gameState.dailyStats.resetTimestamp) || now;
      const elapsed = Math.max(0, now - resetTimestamp);
      remainingMs = Math.max(0, cycleMs - elapsed);
    }
  }

  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  timerEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

window.updateMonthlyCompetitionTimer = updateMonthlyCompetitionTimer;

// Background ticker to update 30-day competition timer and check cycle resets
if (typeof window !== 'undefined' && !window._dailyTasksHiddenTicker) {
  window._dailyTasksHiddenTicker = setInterval(() => {
    if (typeof checkDailyStatsDate === 'function') {
      checkDailyStatsDate();
    }
    updateMonthlyCompetitionTimer();
  }, 1000);
}
