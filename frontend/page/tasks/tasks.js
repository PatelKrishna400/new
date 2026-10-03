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
  },
  {
    id: 'd_sunflower_win',
    number: 15,
    title: '15. Win 20M Sunflower Coins',
    rewardText: '100 Diamonds 💎',
    rewardType: 'diamond',
    rewardVal: 100,
    diamondReward: 100,
    desc: 'Harvest and win 20,000,000 Sunflower Coins to earn 100 Diamonds',
    notes: 'Cultivate your 20-Plot Solar Garden and accumulate 20,000,000 Sunflower Coins from high-tier sun crops. Connected directly to your cloud farm statistics.',
    tip: 'Tip: Upgrade garden plots and water regularly to boost solar coin yield exponentially.',
    type: 'sunflower_coins',
    target: 20000000,
    iconType: 'sunflower',
    colorClass: 'task-yellow',
    iconClass: 'task-icon-yellow',
    accentClass: 'task-tab-accent-yellow',
    liquidTheme: 'liquid-yellow',
    tagClass: 'tag-yellow',
    tagText: 'DIAMOND WIN'
  },
  {
    id: 'd_honey_win',
    number: 16,
    title: '16. Win 10M Honey Coins',
    rewardText: '100 Diamonds 💎',
    rewardType: 'diamond',
    rewardVal: 100,
    diamondReward: 100,
    desc: 'Extract and accumulate 10,000,000 Honey Drops to earn 100 Diamonds',
    notes: 'Breed bees across 20 hives and flower meadows to gather 10,000,000 Honey Drops. Verified via your live Apiary cloud data.',
    tip: 'Tip: Hire forager workers to collect pollen while you manage apiaries.',
    type: 'honey_coins',
    target: 10000000,
    iconType: 'honey',
    colorClass: 'task-orange',
    iconClass: 'task-icon-orange',
    accentClass: 'task-tab-accent-orange',
    liquidTheme: 'liquid-orange',
    tagClass: 'tag-orange',
    tagText: 'DIAMOND WIN'
  },
  {
    id: 'd_crystal_win',
    number: 17,
    title: '17. Win 5M Crystal Coins',
    rewardText: '100 Diamonds 💎',
    rewardType: 'diamond',
    rewardVal: 100,
    diamondReward: 100,
    desc: 'Mine and synthesize 5,000,000 Crystal Shards to earn 100 Diamonds',
    notes: 'Excavate the 20 subterranean terraces to extract 5,000,000 Crystal Shards. Backed by authoritative forge database statistics.',
    tip: 'Tip: Keep thermal cooling towers running to prevent crystal spires from overheating.',
    type: 'crystal_coins',
    target: 5000000,
    iconType: 'crystal',
    colorClass: 'task-purple',
    iconClass: 'task-icon-purple',
    accentClass: 'task-tab-accent-purple',
    liquidTheme: 'liquid-purple',
    tagClass: 'tag-purple',
    tagText: 'DIAMOND WIN'
  }
];

// Backwards compatibility alias
const DAILY_TASKS = MONTHLY_TASKS;

const TELEGRAM_TASKS = [];
const WEBSITE_TASKS = [];

let _cachedMonthlyList = null;
let _cachedMonthlyRawRef = null;
let _monthlyTaskMap = new Map();

let _cachedWebsiteList = null;
let _cachedWebsiteRawRef = null;
let _websiteTaskMap = new Map();

let _cachedTelegramList = null;
let _cachedTelegramRawRef = null;
let _telegramTaskMap = new Map();

function getMonthlyTasksList() {
  let list = window.cloudMonthlyTasks;
  if (!list || !Array.isArray(list)) {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_MONTHLY_TASKS_CONFIG_V1');
      if (cached) {
        list = JSON.parse(cached);
        if (Array.isArray(list)) window.cloudMonthlyTasks = list;
      }
    } catch (e) {}
  }
  if (!list || !Array.isArray(list) || list.length === 0) {
    return MONTHLY_TASKS;
  }
  if (_cachedMonthlyList && _cachedMonthlyRawRef === list) {
    return _cachedMonthlyList;
  }
  _cachedMonthlyRawRef = list;
  _cachedMonthlyList = list
      .filter(ct => ct && ct.disabled !== true)
      .map((ct, idx) => {
        const target = Number(ct.target || 100);
        const rewardCards = Number(ct.rewardCards || ct.rewardVal || 1);
        const rewardType = ct.rewardType || 'scratch_card';
        const rewardText = ct.rewardText || `${rewardCards} Scratch Card${rewardCards > 1 ? 's' : ''}`;
        const type = ct.type || 'tap';

        let defaultColor = 'task-cyan';
        let defaultIcon = 'lightning';
        let defaultAccent = 'task-tab-accent-cyan';
        let defaultLiquid = 'liquid-cyan';
        let defaultIconClass = 'task-icon-cyan';

        if (type === 'tap') {
          defaultColor = 'task-cyan';
          defaultIcon = 'lightning';
        } else if (type.startsWith('fuel_')) {
          const color = type.replace('fuel_', '').split('_')[0];
          defaultColor = `task-${color}`;
          defaultAccent = `task-tab-accent-${color}`;
          defaultLiquid = `liquid-${color}`;
          defaultIconClass = `task-icon-${color}`;
          defaultIcon = 'pump';
        } else if (type === 'spin') {
          defaultColor = 'task-purple';
          defaultAccent = 'task-tab-accent-purple';
          defaultLiquid = 'liquid-purple';
          defaultIconClass = 'task-icon-purple';
          defaultIcon = 'wheel';
        } else if (type === 'chest') {
          defaultColor = 'task-yellow';
          defaultAccent = 'task-tab-accent-yellow';
          defaultLiquid = 'liquid-yellow';
          defaultIconClass = 'task-icon-yellow';
          defaultIcon = 'chest';
        } else if (type === 'scratch') {
          defaultColor = 'task-pink';
          defaultAccent = 'task-tab-accent-pink';
          defaultLiquid = 'liquid-pink';
          defaultIconClass = 'task-icon-pink';
          defaultIcon = 'scratch';
        } else if (type === 'egg') {
          defaultColor = 'task-green';
          defaultAccent = 'task-tab-accent-green';
          defaultLiquid = 'liquid-green';
          defaultIconClass = 'task-icon-green';
          defaultIcon = 'egg';
        }

        return {
          ...ct,
          id: ct.id || `m_${idx + 1}`,
          number: ct.number !== undefined ? ct.number : (idx + 1),
          title: ct.title || `${idx + 1}. Monthly Quest`,
          rewardText: rewardText,
          rewardType: rewardType,
          rewardVal: rewardCards,
          desc: ct.desc || `Complete quest to win ${rewardText}`,
          notes: ct.notes || ct.desc || 'Complete this monthly quest during the 30-day competition cycle.',
          tip: ct.tip || 'Tip: Work towards this quest daily to claim your prize!',
          type: type,
          target: target,
          iconType: ct.iconType || defaultIcon,
          colorClass: ct.colorClass || defaultColor,
          iconClass: ct.iconClass || defaultIconClass,
          accentClass: ct.accentClass || defaultAccent,
          liquidTheme: ct.liquidTheme || defaultLiquid,
          tagClass: ct.tagClass || (ct.colorClass ? ct.colorClass.replace('task-', 'tag-') : 'tag-cyan'),
          tagText: ct.tagText || 'MONTHLY QUEST'
        };
      });
  _monthlyTaskMap = new Map(_cachedMonthlyList.map(t => [t.id, t]));
  return _cachedMonthlyList;
}

const DEFAULT_WEB_TASKS = [
  {
    id: 'web_1',
    title: 'Visit Cyber Energy Portal & Discover Secret PIN',
    url: 'https://telegram.org',
    code: '7842',
    costCoins: 1000,
    diamondReward: 100,
    timer: 15,
    duration: 15,
    tagText: 'SPONSOR QUEST',
    desc: 'Unlock with 1,000 Coins, browse sponsor page, and enter 4-digit code to win 100 Diamonds 💎',
    notes: 'Spend 1,000 Coins to unlock this sponsor quest. Tap Open Website (link is hidden) to browse the page and find the secret 4-digit PIN. Enter code in Verification to win 100 Diamonds. Caution: Wrong code eliminates the quest!',
    tip: 'Tip: The secret 4-digit PIN is hidden inside the destination website.',
    iconType: 'globe',
    colorClass: 'task-cyan',
    iconClass: 'task-icon-cyan',
    accentClass: 'task-tab-accent-cyan',
    liquidTheme: 'liquid-cyan',
    btnText: '1,000 🪙',
    disabled: false
  }
];

function getWebsiteTasksList() {
  let list = window.cloudWebsiteTasks;
  if (!list || !Array.isArray(list) || list.length === 0) {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_WEBSITE_TASKS_CONFIG_V1') || localStorage.getItem('ENERGY_TAP_WEB_TASKS');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
          window.cloudWebsiteTasks = list;
        }
      }
    } catch (e) {}
  }
  if (!list || !Array.isArray(list) || list.length === 0) {
    list = DEFAULT_WEB_TASKS;
  }

  if (_cachedWebsiteList && _cachedWebsiteRawRef === list) {
    return _cachedWebsiteList;
  }
  _cachedWebsiteRawRef = list;

  _cachedWebsiteList = list
    .filter(ct => ct && ct.disabled !== true)
    .map((ct, idx) => {
      const cost = ct.costCoins !== undefined ? Number(ct.costCoins) : 1000;
      const diamonds = ct.diamondReward !== undefined ? Number(ct.diamondReward) : (ct.diamonds ? Number(ct.diamonds) : 100);
      const tag = ct.tag || ct.tagText || 'SPONSOR QUEST';
      return {
        ...ct,
        id: ct.id || `web_${idx + 1}`,
        title: ct.title || `Website Quest #${idx + 1}`,
        costCoins: cost,
        diamondReward: diamonds,
        code: (ct.code || '1234').toString().trim(),
        timer: Number(ct.timer || ct.duration || 15),
        duration: Number(ct.timer || ct.duration || 15),
        rewardText: `${diamonds} Diamonds 💎`,
        tagText: tag,
        tag: tag,
        desc: ct.desc || `Unlock with ${cost.toLocaleString()} Coins, visit site, and enter 4-digit code to win ${diamonds} Diamonds 💎`,
        notes: ct.notes || ct.desc || `Spend ${cost.toLocaleString()} Coins to open this website. Enter 4-digit PIN to claim ${diamonds} Diamonds.`,
        tip: ct.tip || 'Tip: Look carefully on the destination page for your 4-digit secret code.',
        iconType: ct.iconType || 'globe',
        colorClass: ct.colorClass || 'task-cyan',
        iconClass: ct.iconClass || 'task-icon-cyan',
        accentClass: ct.accentClass || 'task-tab-accent-cyan',
        liquidTheme: ct.liquidTheme || 'liquid-cyan',
        btnText: ct.btnText || `${cost.toLocaleString()} 🪙`
      };
    });
  _websiteTaskMap = new Map(_cachedWebsiteList.map(t => [t.id, t]));
  return _cachedWebsiteList;
}

function getTelegramTasksList() {
  let list = window.cloudTelegramTasks;
  if (!list || !Array.isArray(list)) {
    try {
      const cached = localStorage.getItem('ENERGY_TAP_TELEGRAM_TASKS_CONFIG_V1') || localStorage.getItem('ENERGY_TAP_TG_TASKS');
      if (cached) {
        list = JSON.parse(cached);
        if (Array.isArray(list)) window.cloudTelegramTasks = list;
      }
    } catch (e) {}
  }
  if (!list || !Array.isArray(list) || list.length === 0) {
    return [];
  }

  if (_cachedTelegramList && _cachedTelegramRawRef === list) {
    return _cachedTelegramList;
  }
  _cachedTelegramRawRef = list;

  _cachedTelegramList = list
      .filter(ct => ct && ct.disabled !== true)
      .map((ct, idx) => {
        const isBot = ct.iconType === 'bot' || (ct.url && ct.url.toLowerCase().includes('bot')) || (ct.tagText && ct.tagText.includes('BOT'));
        const coins = Number(ct.coins !== undefined ? ct.coins : (ct.rewardCoins !== undefined ? ct.rewardCoins : (ct.rewardCards || ct.scratchCards || ct.rewardKeys || ct.diamonds ? 0 : 100)));
        const cards = Number(ct.rewardCards || ct.scratchCards || 0);
        const keys = Number(ct.rewardKeys || 0);
        const diamonds = Number(ct.diamonds || ct.rewardDiamonds || 0);

        let rewardText = ct.rewardText;
        if (!rewardText) {
          if (coins > 0) rewardText = `+${coins.toLocaleString()} Coins 🪙`;
          else if (cards > 0) rewardText = `${cards} Scratch Card${cards > 1 ? 's' : ''} 🎴`;
          else if (keys > 0) rewardText = `${keys} Key${keys > 1 ? 's' : ''} for Chest`;
          else if (diamonds > 0) rewardText = `+${diamonds} Diamonds 💎`;
          else rewardText = '+100 Coins 🪙';
        }

        return {
          ...ct,
          id: ct.id || `tg_${idx + 1}`,
          title: ct.title || `Telegram Channel #${idx + 1}`,
          rewardCards: cards,
          scratchCards: cards,
          rewardKeys: keys,
          rewardDiamonds: diamonds,
          rewardCoins: coins,
          rewardText: rewardText,
          iconType: isBot ? 'bot' : (ct.iconType || 'plane'),
          colorClass: ct.colorClass || 'task-blue',
          iconClass: ct.iconClass || 'task-icon-blue',
          accentClass: ct.accentClass || 'task-tab-accent-blue',
          liquidTheme: ct.liquidTheme || 'liquid-blue',
          tagClass: ct.tagClass || 'tag-blue',
          tagText: ct.tagText || (isBot ? 'TELEGRAM BOT' : 'TELEGRAM CHANNEL'),
          desc: ct.desc || `Join ${ct.title || 'channel'} on Telegram to win ${rewardText}`,
          notes: ct.notes || `Join and follow instructions to claim your ${rewardText} reward!`,
          tip: ct.tip || 'Tip: Tap the button below to launch Telegram directly.',
          btnText: ct.btnText || (isBot ? 'Join Bot' : 'Join Channel')
        };
      });
  _telegramTaskMap = new Map(_cachedTelegramList.map(t => [t.id, t]));
  return _cachedTelegramList;
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

  // Hide 30-day competition timer tab/banner on Telegram and Website tabs
  const monthlyBanner = document.getElementById('monthlyCompetitionBanner');
  if (monthlyBanner) {
    monthlyBanner.style.display = subtabName === 'daily' ? 'flex' : 'none';
  }

  // Toggle Website Task Guide Banner: Only visible when on 'website' subtab
  const websiteGuideBanner = document.getElementById('websiteGuideBanner');
  if (websiteGuideBanner) {
    websiteGuideBanner.style.display = subtabName === 'website' ? 'flex' : 'none';
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
  } else if (iconType === 'globe') {
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`;
  } else if (iconType === 'sunflower') {
    return `<span style="font-size: 20px; line-height: 1;">🌻</span>`;
  } else if (iconType === 'honey') {
    return `<span style="font-size: 20px; line-height: 1;">🍯</span>`;
  } else if (iconType === 'crystal') {
    return `<span style="font-size: 20px; line-height: 1;">🔮</span>`;
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
  } else if (task.type === 'sunflower_coins') {
    const fromState = (window.sunflowerState && Number(window.sunflowerState.coins || 0)) || 0;
    const fromPlayer = (gameState.player && Number(gameState.player.sunflowerCoinsWon || gameState.player.sunflowerCoins || 0)) || 0;
    const fromStats = (gameState.dailyStats && Number(gameState.dailyStats.sunflowerCoins || 0)) || 0;
    return Math.max(fromState, fromPlayer, fromStats);
  } else if (task.type === 'honey_coins') {
    const fromState = (window.beeState && Number(window.beeState.honey || 0)) || 0;
    const fromPlayer = (gameState.player && Number(gameState.player.honeyCoinsWon || gameState.player.honeyCoins || 0)) || 0;
    const fromStats = (gameState.dailyStats && Number(gameState.dailyStats.honeyCoins || 0)) || 0;
    return Math.max(fromState, fromPlayer, fromStats);
  } else if (task.type === 'crystal_coins') {
    const fromState = (window.mineState && Number(window.mineState.crystals || 0)) || 0;
    const fromPlayer = (gameState.player && Number(gameState.player.crystalCoinsWon || gameState.player.crystalCoins || 0)) || 0;
    const fromStats = (gameState.dailyStats && Number(gameState.dailyStats.crystalCoins || 0)) || 0;
    return Math.max(fromState, fromPlayer, fromStats);
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
  if (task.type === 'sunflower_coins') return { page: 'sunflower', text: 'Go to Solar Farm' };
  if (task.type === 'honey_coins') return { page: 'bee-farm', text: 'Go to Bee Farm' };
  if (task.type === 'crystal_coins') return { page: 'mining', text: 'Go to Crystal Mine' };
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

  const allMonthlyTasks = getMonthlyTasksList();
  const allWebsiteTasks = getWebsiteTasksList();
  const allTelegramTasks = getTelegramTasksList();
  const activeDailyTasks = allMonthlyTasks.filter(task => !gameState.tasksState.claimedDaily[task.id] && task.disabled !== true);
  const activeTelegramTasks = allTelegramTasks.filter(task => !gameState.tasksState.claimedTelegram[task.id] && task.disabled !== true);
  const activeWebsiteTasks = allWebsiteTasks.filter(task => 
    !gameState.tasksState.claimedWebsite[task.id] && !gameState.tasksState.failedWebsite[task.id] && task.disabled !== true
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

  // If tasks page is not currently active, avoid rebuilding full 30+ card DOM list
  if (gameState.currentTab !== 'tasks') {
    return;
  }

  // Show/Hide 30-day competition timer banner: Only visible on Monthly ('daily') subtab; removed on Telegram and Website
  const monthlyBanner = document.getElementById('monthlyCompetitionBanner');
  if (monthlyBanner) {
    monthlyBanner.style.display = gameState.taskSubtab === 'daily' ? 'flex' : 'none';
  }

  // Show/Hide Website Guide & How-To-Use Banner: Only visible on Website subtab
  const webGuideBanner = document.getElementById('websiteGuideBanner');
  if (webGuideBanner) {
    webGuideBanner.style.display = gameState.taskSubtab === 'website' ? 'flex' : 'none';
  }

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
            <button class="task-tab-notes-indicator" onclick="joinTelegramTask('${task.id}', event)">
              <span>${task.btnText || 'Join'}</span>
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
    // Website Tasks Subtab (1,000 Coin buy, hidden URL open, 4-digit code verification, win Diamonds or eliminated)
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
      const cost = task.costCoins !== undefined ? Number(task.costCoins) : 1000;

      html += `
        <div class="task-decorated-tab-card task-web-mode ${task.colorClass || ''}" 
             id="webCard-${task.id}" 
             onclick="openTaskNotesPopup('${task.id}', 'website')" 
             role="button" 
             tabindex="0">

          <!-- Left Accent Bar -->
          <div class="task-tab-accent-bar ${task.accentClass || 'bar-cyan'}"></div>

          <!-- 3D Icon Box -->
          <div class="task-tab-icon-box ${task.iconClass || 'box-cyan'}">
            ${webSvg}
          </div>

          <!-- Title & Subtag -->
          <div class="task-tab-text-info">
            <div class="task-tab-title-row">
              <span class="task-tab-title">${task.title}</span>
              <span class="task-cat-tag ${task.tagClass || 'tag-cyan'}">${task.tagText || task.tag || 'Web Quest'}</span>
            </div>
            <div class="task-web-reward-subtext">
              <span class="reward-dia-text">Win +${task.diamondReward || 100} 💎</span>
              <span class="reward-cost-text">(Cost: ${cost.toLocaleString()} 🪙)</span>
            </div>
          </div>

          <!-- Right Action Col: If not bought, show 1 button: 1,000 🪙. If bought, show Open (link hidden) and Verification ON -->
          <div class="task-tab-right-col">
            ${!isAlreadyOpened
              ? `<button class="task-web-btn buy-mode" onclick="buyWebsiteTask('${task.id}', event)" title="Unlock for ${cost.toLocaleString()} Coins">
                   <span>${cost.toLocaleString()} 🪙</span>
                 </button>`
              : `<div class="task-web-actions-row">
                   <button class="task-web-btn open-mode" onclick="openWebsiteTaskHiddenUrl('${task.id}', event)" title="Open Website (URL hidden)">
                     <span>Open 🌐</span>
                   </button>
                   <button class="task-web-btn verify-mode" onclick="openWebCodeModal('${task.id}', event)" title="Verification ON - Enter 4-Digit Secret PIN">
                     <span>Verification 🔑</span>
                   </button>
                 </div>`
            }
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
    task = _monthlyTaskMap.get(taskId) || getMonthlyTasksList().find(t => t.id === taskId) || DAILY_TASKS.find(t => t.id === taskId);
  } else if (subtabType === 'telegram') {
    task = _telegramTaskMap.get(taskId) || getTelegramTasksList().find(t => t.id === taskId);
  } else {
    task = _websiteTaskMap.get(taskId) || getWebsiteTasksList().find(t => t.id === taskId);
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
      progLiquid.style.width = `${Math.max(percent, 2)}%`;
      progLiquid.className = `task-notes-prog-liquid ${task.liquidTheme || 'liquid-cyan'}`;
    }
  } else {
    if (progVal) {
      progVal.textContent = subtabType === 'website' ? '1-Time Sponsor Quest' : '1-Time Partner Quest';
    }
    if (progLiquid) {
      progLiquid.style.width = '100%';
      progLiquid.className = 'task-notes-prog-liquid liquid-blue';
    }
  }

  // 3. Description & Notes
  const descEl = document.getElementById('taskNotesDesc');
  if (descEl) {
    descEl.textContent = task.notes || task.desc || 'Complete quest objectives to earn your reward.';
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
    if (subtabType === 'daily') {
      rewardIconEl.textContent = '🎴';
    } else if (subtabType === 'website') {
      rewardIconEl.textContent = '💎';
    } else {
      rewardIconEl.textContent = (task.rewardCards || task.scratchCards) ? '🎴' : (task.rewardKeys ? '🔑' : (task.rewardDiamonds ? '💎' : (task.rewardCoins ? '🪙' : '🎴')));
    }
  }
  if (statusTag) {
    if (subtabType === 'website') {
      const isAlreadyOpened = gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[task.id];
      const cost = task.costCoins !== undefined ? Number(task.costCoins) : 1000;
      statusTag.textContent = isAlreadyOpened ? 'UNLOCKED (PIN READY)' : `${cost.toLocaleString()} COIN COST`;
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
      const btnText = task.btnText || 'Join Channel';
      actionsWrap.innerHTML = `
        <button class="notes-nav-btn" onclick="joinTelegramFromNotes('${task.id}')">
          <span>✈️ ${btnText}</span>
        </button>
        <button class="notes-close-action-btn" onclick="closeTaskNotesPopup()">Close</button>
      `;
    } else {
      const isAlreadyOpened = gameState.tasksState.openedWebsite && gameState.tasksState.openedWebsite[task.id];
      const cost = task.costCoins !== undefined ? Number(task.costCoins) : 1000;
      if (isAlreadyOpened) {
        actionsWrap.innerHTML = `
          <button class="notes-nav-btn" onclick="closeTaskNotesPopup(); openWebsiteTaskHiddenUrl('${task.id}')" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
            <span>🌐 Open Website</span>
          </button>
          <button class="notes-nav-btn" onclick="closeTaskNotesPopup(); openWebCodeModal('${task.id}')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <span>🔑 Enter Verification PIN</span>
          </button>
          <button class="notes-close-action-btn" onclick="closeTaskNotesPopup()">Close</button>
        `;
      } else {
        actionsWrap.innerHTML = `
          <button class="notes-nav-btn" onclick="closeTaskNotesPopup(); buyWebsiteTask('${task.id}')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <span>${cost.toLocaleString()} 🪙</span>
          </button>
          <button class="notes-close-action-btn" onclick="closeTaskNotesPopup()">Close</button>
        `;
      }
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

function joinTelegramFromNotes(taskId) {
  closeTaskNotesPopup();
  joinTelegramTask(taskId);
}

function visitWebsiteFromNotes(taskId) {
  closeTaskNotesPopup();
  startWebsiteTask(taskId);
}

// ==========================================================================
// WEBSITE QUEST CONTROLLER (1,000 COIN COST, HIDDEN URL & 4-DIGIT VERIFICATION)
// ==========================================================================
let activeVerifyingTaskId = null;

function buyWebsiteTask(taskId, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const allWebsiteTasks = getWebsiteTasksList();
  const task = _websiteTaskMap.get(taskId) || allWebsiteTasks.find(t => t.id === taskId);
  if (!task) return;

  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  if (gameState.tasksState.openedWebsite[taskId]) {
    // Already purchased, directly open verification modal
    openWebCodeModal(taskId);
    return;
  }

  // Check if player has required Coins (default 1,000)
  const cost = task.costCoins !== undefined ? Number(task.costCoins) : 1000;
  if ((gameState.player.coins || 0) < cost) {
    sfx.playErrorSound();
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`⚠️ Insufficient Coins! Need ${cost.toLocaleString()} 🪙 to buy task.`);
    } else {
      alert(`Insufficient Coins! You need ${cost.toLocaleString()} Coins to buy this website quest.`);
    }
    return;
  }

  // Deduct Coins
  gameState.player.coins -= cost;
  gameState.tasksState.openedWebsite[taskId] = true;
  saveGame();
  updateUI();

  if (typeof showFloatingToast === 'function') {
    showFloatingToast(`🪙 -${cost.toLocaleString()} Coins paid! Open & Verification unlocked.`);
  }
  sfx.playBuySound();

  // Re-render tasks list to show Open & Verification buttons
  renderTasksList();
}

function openWebsiteTaskHiddenUrl(taskId, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const allWebsiteTasks = getWebsiteTasksList();
  const task = _websiteTaskMap.get(taskId) || allWebsiteTasks.find(t => t.id === taskId);
  if (!task || !task.url) {
    if (typeof showFloatingToast === 'function') {
      showFloatingToast('⚠️ Website link not found.');
    }
    return;
  }

  // Securely open hidden link without displaying URL text on page
  window.open(task.url, '_blank', 'noopener,noreferrer');
  sfx.playTapSound(1);
}

function startWebsiteTask(taskId, event) {
  if (!gameState.tasksState.openedWebsite) gameState.tasksState.openedWebsite = {};
  const isAlreadyOpened = gameState.tasksState.openedWebsite[taskId];
  if (isAlreadyOpened) {
    openWebCodeModal(taskId);
  } else {
    buyWebsiteTask(taskId, event);
  }
}

function openWebCodeModal(taskId) {
  const allWebsiteTasks = getWebsiteTasksList();
  const task = _websiteTaskMap.get(taskId) || allWebsiteTasks.find(t => t.id === taskId);
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
  const task = _websiteTaskMap.get(activeVerifyingTaskId) || allWebsiteTasks.find(t => t.id === activeVerifyingTaskId);
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
  const task = _websiteTaskMap.get(taskId) || allWebsiteTasks.find(t => t.id === taskId);
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
window.getMonthlyTasksList = getMonthlyTasksList;
window.getWebsiteTasksList = getWebsiteTasksList;
window.getTelegramTasksList = getTelegramTasksList;

window.addEventListener('monthlyTasksUpdated', () => {
  if (typeof renderTasksList === 'function') {
    renderTasksList();
  }
});
window.switchTaskSubtab = switchTaskSubtab;
window.renderTasksList = renderTasksList;
window.claimDailyTaskReward = claimDailyTaskReward;
window.joinTelegramTask = joinTelegramTask;
window.startWebsiteTask = startWebsiteTask;
window.buyWebsiteTask = buyWebsiteTask;
window.openWebsiteTaskHiddenUrl = openWebsiteTaskHiddenUrl;
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

// Claim Daily Task: Awards Scratch Cards or Diamonds, triggers emoji burst, and smoothly removes task tab
function claimDailyTaskReward(taskId, event) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }

  const task = _monthlyTaskMap.get(taskId) || getMonthlyTasksList().find(t => t.id === taskId) || DAILY_TASKS.find(t => t.id === taskId);
  if (!task) return;

  // Strict anti-duplicate and completion check
  if (gameState.tasksState && (gameState.tasksState.claimedDaily[taskId] || (gameState.tasksState.claimedMonthly && gameState.tasksState.claimedMonthly[taskId]))) {
    if (typeof showFloatingToast === 'function') showFloatingToast('⚠️ Task already claimed!');
    return;
  }
  const currentProgress = getTaskCurrentProgress(task);
  if (currentProgress < task.target) {
    if (typeof showFloatingToast === 'function') showFloatingToast('⚠️ Task requirement not completed yet!');
    return;
  }

  const executeClaim = () => {
    const card = document.getElementById(`taskCard-${taskId}`);
    
    // 1. Emoji Burst Effect
    spawnTaskEmojiBurst(card);
    sfx.playLevelUpSound();

    // 2. Animate and collapse card
    if (card) {
      card.classList.add('task-claimed-exit');
    }

    // 3. Mark claimed
    gameState.tasksState.claimedDaily[taskId] = true;
    if (!gameState.tasksState.claimedMonthly) gameState.tasksState.claimedMonthly = {};
    gameState.tasksState.claimedMonthly[taskId] = true;

    // 4. Award Diamonds or Scratch Cards
    const isDiamondReward = task.rewardType === 'diamond' || task.rewardType === 'diamonds' || (task.diamondReward && task.diamondReward > 0);
    if (isDiamondReward) {
      const diaCount = Number(task.diamondReward || task.rewardVal || 100);
      gameState.player.diamonds = (gameState.player.diamonds || 0) + diaCount;
      gameState.player.diamondWins = (gameState.player.diamondWins || 0) + 1;
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`💎 +${diaCount} Diamonds Claimed!`);
      }
    } else {
      const rewardCount = Number(task.rewardCards || task.rewardVal || 1);
      gameState.player.scratchCards = (gameState.player.scratchCards || 0) + rewardCount;
      gameState.player.chestTickets = (gameState.player.chestTickets || 0) + rewardCount;
      if (gameState.goalState && gameState.goalState.levelProgress) {
        gameState.goalState.levelProgress.cards = (gameState.goalState.levelProgress.cards || 0) + rewardCount;
      }
      if (typeof showFloatingToast === 'function') {
        showFloatingToast(`🎴 +${rewardCount} Scratch Card${rewardCount > 1 ? 's' : ''} Claimed!`);
      }
    }

    // 5. Remove from DOM after smooth collapse & sync to Firebase immediately
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

// Join Telegram Task: opens link, awards configured rewards, bursts emojis, and smoothly removes task tab
function joinTelegramTask(taskId, title, rewardKeys, url, event) {
  let ev = event;
  if (title && (typeof title.stopPropagation === 'function' || title.preventDefault)) {
    ev = title;
  }
  if (ev && typeof ev.stopPropagation === 'function') {
    ev.stopPropagation();
  }

  const allTelegramTasks = getTelegramTasksList();
  const task = _telegramTaskMap.get(taskId) || allTelegramTasks.find(t => t.id === taskId);
  if (!task) return;

  // Open the Telegram link
  const targetUrl = task.url || (typeof url === 'string' ? url : null);
  if (targetUrl) {
    window.open(targetUrl, '_blank');
  }

  const card = document.getElementById(`tgCard-${taskId}`);
  spawnTaskEmojiBurst(card);
  sfx.playLevelUpSound();

  if (card) {
    card.classList.add('task-claimed-exit');
  }

  // Award configured reward (Coins, Cards, Keys, or Diamonds)
  const coinsCount = Number(task.coins !== undefined ? task.coins : (task.rewardCoins !== undefined ? task.rewardCoins : 0));
  const cardsCount = Number(task.rewardCards || task.scratchCards || 0);
  const keysCount = Number(task.rewardKeys || (rewardKeys !== undefined ? rewardKeys : 0));
  const diamondsCount = Number(task.diamonds || task.rewardDiamonds || 0);

  gameState.tasksState.claimedTelegram[taskId] = true;

  if (coinsCount > 0) {
    gameState.player.coins = (gameState.player.coins || 0) + coinsCount;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🪙 +${coinsCount.toLocaleString()} Coins Claimed!`);
    }
  } else if (cardsCount > 0) {
    gameState.player.scratchCards = (gameState.player.scratchCards || 0) + cardsCount;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🎴 +${cardsCount} Scratch Card${cardsCount > 1 ? 's' : ''} Claimed!`);
    }
  } else if (keysCount > 0) {
    gameState.player.chestKeys = (gameState.player.chestKeys || 0) + keysCount;
    if (gameState.goalState && gameState.goalState.levelProgress) {
      gameState.goalState.levelProgress.keys = (gameState.goalState.levelProgress.keys || 0) + keysCount;
    }
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🔑 +${keysCount} Key${keysCount > 1 ? 's' : ''} Claimed!`);
    }
  } else if (diamondsCount > 0) {
    gameState.player.diamonds = (gameState.player.diamonds || 0) + diamondsCount;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`💎 +${diamondsCount} Diamonds Claimed!`);
    }
  } else {
    gameState.player.coins = (gameState.player.coins || 0) + 100;
    if (typeof showFloatingToast === 'function') {
      showFloatingToast(`🪙 +100 Coins Claimed!`);
    }
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

// Real-Time Firebase Synchronizers for Tasks
window.addEventListener('websiteTasksUpdated', () => {
  _cachedWebsiteList = null;
  _cachedWebsiteRawRef = null;
  if (typeof renderTasksList === 'function') renderTasksList();
});
window.addEventListener('telegramTasksUpdated', () => {
  _cachedTelegramList = null;
  _cachedTelegramRawRef = null;
  if (typeof renderTasksList === 'function') renderTasksList();
});

// Auto-initialize when Tasks Page renders only if tasks page is active
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof gameState !== 'undefined' && gameState.currentTab === 'tasks') {
        if (typeof renderTasksList === 'function') renderTasksList();
      }
    });
  } else {
    setTimeout(() => {
      if (typeof gameState !== 'undefined' && gameState.currentTab === 'tasks') {
        if (typeof renderTasksList === 'function') renderTasksList();
      }
    }, 0);
  }
}

// 30-Day Diamond Win Tasks Competition Countdown Timer (Firebase & Calendar Synced)
function getAuthoritativeMonthlyEndTime() {
  const now = Date.now();
  if (gameState.monthlyCompetition && typeof gameState.monthlyCompetition.endTime === 'number' && gameState.monthlyCompetition.endTime > now) {
    return gameState.monthlyCompetition.endTime;
  }
  try {
    const stored = localStorage.getItem('ENERGY_TAP_MONTHLY_COMPETITION_END');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed && parsed > now) {
        if (!gameState.monthlyCompetition) gameState.monthlyCompetition = {};
        gameState.monthlyCompetition.endTime = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  const d = new Date(now);
  const endOfMonthUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0);

  if (!gameState.monthlyCompetition) gameState.monthlyCompetition = {};
  gameState.monthlyCompetition.endTime = endOfMonthUTC;
  try {
    localStorage.setItem('ENERGY_TAP_MONTHLY_COMPETITION_END', String(endOfMonthUTC));
  } catch (e) {}

  if (window.firebaseSync && window.firebaseSync.database) {
    window.firebaseSync.database.ref('competition/monthly/endTime').transaction((curr) => {
      return curr && curr > now ? curr : endOfMonthUTC;
    });
  }

  return endOfMonthUTC;
}

function updateMonthlyCompetitionTimer() {
  const timerEl = document.getElementById('monthlyCompetitionTimer');
  if (!timerEl) return;

  const now = Date.now();
  const endTime = getAuthoritativeMonthlyEndTime();
  const remainingMs = Math.max(0, endTime - now);

  const totalSecs = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  timerEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;

  if (remainingMs <= 0) {
    const d = new Date();
    const nextMonthEnd = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0);
    if (gameState.monthlyCompetition) gameState.monthlyCompetition.endTime = nextMonthEnd;
    try {
      localStorage.setItem('ENERGY_TAP_MONTHLY_COMPETITION_END', String(nextMonthEnd));
    } catch (e) {}
    if (gameState.tasksState) {
      gameState.tasksState.claimedDaily = {};
      gameState.tasksState.claimedMonthly = {};
    }
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloudImmediate === 'function') {
      window.firebaseSync.saveToCloudImmediate();
    }
    renderTasksList();
  }
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

