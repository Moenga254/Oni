export const levels = [
  {
    id: 0,
    name: "Grasslands",
    subtitle: "Level 1",

    // ☀️ Sunny meadow: snowy mountains, rolling hills with trees, fluffy clouds, grassy platforms (see src/utils/Backdrops.js)
    theme: "grass",
    background: [0x2f7fd0, 0x2f7fd0, 0xa9dcff, 0xe2f4ff], // deep blue sky fading to a pale horizon
    groundColor: 0x4a7c2f,
    platformColor: 0x8B4513,
    worldWidth: 3200,
    playerStart: [80, 490],
    flagX: 3100,
    timeLimit: 90, // seconds

    platforms: [
      [0,    570, 600,  30],
      [700,  570, 400,  30],
      [1200, 570, 500,  30],
      [1800, 570, 300,  30],
      [2200, 570, 600,  30],
      [2900, 570, 400,  30],
      [300,  450, 150,  20],
      [550,  380, 150,  20],
      [800,  460, 120,  20],
      [1000, 380, 150,  20],
      [1250, 460, 120,  20],
      [1450, 350, 180,  20],
      [1650, 440, 120,  20],
      [1900, 350, 150,  20],
      [2100, 440, 120,  20],
      [2350, 380, 150,  20],
      [2550, 460, 120,  20],
      [2750, 350, 180,  20],
      [2950, 440, 150,  20],
    ],

    coins: [
      [300, 420], [560, 350], [810, 430], [1010, 350],
      [1260, 430], [1460, 320], [1660, 410], [1910, 320],
      [2360, 350], [2760, 320]
    ],

    enemies: [
      [200,  540, 50,   550,  80,  0xff4444],
      [750,  540, 710,  1080, 70,  0xff4444],
      [1300, 540, 1210, 1680, 90,  0xff6600],
      [1850, 540, 1810, 2180, 80,  0xff4444],
      [2300, 540, 2210, 2780, 100, 0xff6600],
      [2950, 540, 2910, 3180, 80,  0xff4444],
      [320,  420, 305,  445,  60,  0xaa00ff],
      [570,  350, 555,  695,  60,  0xaa00ff],
      [1020, 350, 1005, 1145, 60,  0xaa00ff],
      [1470, 320, 1455, 1625, 60,  0xaa00ff],
      [2370, 350, 2355, 2495, 60,  0xaa00ff],
    ],

    // Moving platforms [x, y, width, moveX, speed]
    movingPlatforms: [
      [400, 300, 120, 100, 80],
      [900, 280, 100, 80,  90],
    ]
  },

  {
    id: 1,
    name: "Crystal Cave",
    subtitle: "Level 2",

    // 💎 A deep purple cave full of glowing crystals, with sparkles in the air (see src/utils/Backdrops.js)
    theme: "crystal",
    background: [0x2a0f4f, 0x2a0f4f, 0x0c0420, 0x08021a],
    groundColor: 0x3a2f55,
    platformColor: 0x6644aa,
    worldWidth: 3800,
    playerStart: [80, 490],
    flagX: 3700,
    timeLimit: 75, // less time

    platforms: [
      // Ground with more gaps
      [0,    570, 400,  30],
      [500,  570, 250,  30],
      [850,  570, 300,  30],
      [1250, 570, 200,  30],
      [1550, 570, 350,  30],
      [2000, 570, 250,  30],
      [2350, 570, 300,  30],
      [2750, 570, 200,  30],
      [3050, 570, 400,  30],
      [3550, 570, 300,  30],

      // Floating — smaller and tighter
      [250,  460, 100,  20],
      [430,  390, 100,  20],
      [610,  460, 100,  20],
      [780,  380, 120,  20],
      [970,  460, 100,  20],
      [1130, 370, 100,  20],
      [1320, 450, 110,  20],
      [1500, 360, 100,  20],
      [1700, 440, 100,  20],
      [1880, 350, 120,  20],
      [2080, 440, 100,  20],
      [2250, 360, 100,  20],
      [2450, 440, 110,  20],
      [2620, 350, 100,  20],
      [2820, 440, 100,  20],
      [3000, 360, 120,  20],
      [3200, 440, 100,  20],
      [3380, 350, 120,  20],
    ],

    coins: [
      [260, 430], [440, 360], [620, 430], [790, 350],
      [980, 430], [1140, 340], [1510, 330], [1710, 410],
      [2090, 410], [2260, 330], [2630, 320], [3010, 330]
    ],

    enemies: [
      // Faster enemies
      [200,  540, 50,   380,  110, 0xff2222],
      [550,  540, 510,  780,  120, 0xff2222],
      [900,  540, 860,  1130, 130, 0xff4400],
      [1300, 540, 1260, 1530, 110, 0xff2222],
      [1600, 540, 1560, 1970, 120, 0xff4400],
      [2050, 540, 2010, 2320, 130, 0xff2222],
      [2400, 540, 2360, 2720, 110, 0xff4400],
      [2800, 540, 2760, 3020, 120, 0xff2222],
      [3100, 540, 3060, 3520, 130, 0xff4400],

      // Platform enemies — more of them
      [270,  430, 255,  345,  80,  0x8800ff],
      [450,  360, 435,  525,  80,  0x8800ff],
      [800,  350, 785,  1025, 80,  0x8800ff],
      [1140, 340, 1125, 1235, 80,  0x8800ff],
      [1890, 320, 1875, 2075, 80,  0x8800ff],
      [2260, 330, 2245, 2355, 80,  0x8800ff],
    ],

    movingPlatforms: [
      [600,  300, 100, 120, 100],
      [1100, 280, 100, 100, 110],
      [1800, 300, 100, 120, 100],
      [2500, 280, 100, 100, 120],
      [3200, 300, 100, 120, 110],
    ]
  },

  {
    id: 2,
    name: "Sky Kingdom",
    subtitle: "Level 3",

    // 🏰 A kingdom above the clouds at sunset: setting sun, castles on far islands, a sea of clouds,
    // floating rock islands, marble slabs and clouds to ride on (see src/utils/Backdrops.js)
    theme: "sunset",
    background: [0x26285e, 0xc65f7a, 0xff9b4a, 0xffd57e],   // indigo -> rose -> orange -> gold
    groundColor: 0xcc4400,
    platformColor: 0xddaa00,
    worldWidth: 4400,
    playerStart: [80, 490],
    flagX: 4300,
    // 🟢 Checkpoints (x positions, each on solid ground). Dying respawns you at the last one you touched.
    checkpoints: [1525, 2825],
    timeLimit: 70, // hardest — least time

    platforms: [
      // Very sparse ground — mostly gaps
      [0,    570, 300,  30],
      [450,  570, 200,  30],
      [800,  570, 150,  30],
      [1100, 570, 200,  30],
      [1450, 570, 150,  30],
      [1750, 570, 200,  30],
      [2100, 570, 150,  30],
      [2400, 570, 200,  30],
      [2750, 570, 150,  30],
      [3050, 570, 200,  30],
      [3400, 570, 150,  30],
      [3700, 570, 200,  30],
      [4100, 570, 350,  30],

      // Floating — very small, big gaps
      [200,  460,  80,  20],
      [380,  390,  80,  20],
      [550,  460,  80,  20],
      [720,  370,  80,  20],
      [900,  450,  80,  20],
      [1070, 360,  80,  20],
      [1240, 440,  80,  20],
      [1410, 350,  80,  20],
      [1580, 430,  80,  20],
      [1760, 340,  80,  20],
      [1940, 420,  80,  20],
      [2120, 330,  80,  20],
      [2300, 410,  80,  20],
      [2480, 320,  80,  20],
      [2660, 400,  80,  20],
      [2840, 310,  80,  20],
      [3020, 390,  80,  20],
      [3200, 300,  80,  20],
      [3380, 380,  80,  20],
      [3560, 290,  80,  20],
      [3740, 370,  80,  20],
      [3920, 280,  80,  20],
      [4100, 360,  80,  20],
    ],

    coins: [
      [210, 430], [390, 360], [560, 430], [730, 340],
      [910, 420], [1080, 330], [1250, 410], [1420, 320],
      [1590, 400], [1770, 310], [1950, 390], [2130, 300],
      [2310, 380], [2490, 290], [2670, 370], [2850, 280]
    ],

    enemies: [
      // ── First third (before checkpoint 1) ──
      [500,  540, 460,  730,  160, 0xff0000],
      [850,  540, 810,  1070, 150, 0xff2200],
      [1150, 540, 1110, 1420, 160, 0xff0000],
      [560,  430, 545,  625,  100, 0xff6600],
      [910,  420, 895,  975,  100, 0xff6600],
      [1250, 410, 1235, 1315, 100, 0xff6600],

      // ── After checkpoint 1: enemies thin out toward the finish (3 → 2 → 1 → 0) ──
      // Every patrol range stays INSIDE its platform, so nobody walks off the edge.
      // Ground enemies leave the left end of each platform free: that is where you land.

      // x 1600-2300: 3 enemies
      [1870, 540, 1815, 1925, 105, 0xff2200],   // ground    1750-1950
      [2190, 540, 2160, 2225, 100, 0xff2200],   // ground    2100-2250
      [1980, 390, 1952, 2008, 70,  0xff6600],   // floating  1940-2020

      // x 2300-3000: 2 enemies (checkpoint 2 at x=2825 is kept clear)
      [2520, 540, 2465, 2575, 95,  0xff2200],   // ground    2400-2600
      [2340, 380, 2312, 2368, 70,  0xff6600],   // floating  2300-2380

      // x 3000-3600: 1 enemy
      [3170, 540, 3115, 3225, 85,  0xff2200],   // ground    3050-3250

      // x 3600-4300: none, a calm run to the finish flag
    ],


    movingPlatforms: [
      [350,  320, 90, 140, 120],
      [750,  280, 90, 120, 130],
      [1200, 300, 90, 140, 120],
      [1650, 280, 90, 120, 130],
      [2100, 300, 90, 140, 120],
      [2550, 280, 90, 120, 130],
      [3000, 300, 90, 140, 120],
      [3450, 280, 90, 120, 130],
      [3900, 300, 90, 140, 120],
    ]
  },

  {
    id: 3,
  name: "Ice Cave",
  subtitle: "Level 4",

  // Frozen blue atmosphere
  theme: "ice",
  background: [
    0x071a2e,
    0x102d4a,
    0x183e60,
    0x071526
  ],

  groundColor: 0x244b69,
  platformColor: 0x6caacb,

  worldWidth: 4400,
  playerStart: [80, 490],
  flagX: 4300,
  timeLimit: 65,

  checkpoints: [1525, 2825],

  platforms: [
    // Ground
    [0, 570, 300, 30],
    [450, 570, 200, 30],
    [800, 570, 200, 30],
    [1150, 570, 200, 30],
    [1500, 570, 200, 30],
    [1850, 570, 200, 30],
    [2200, 570, 200, 30],
    [2550, 570, 200, 30],
    [2900, 570, 200, 30],
    [3250, 570, 200, 30],
    [3600, 570, 200, 30],
    [4000, 570, 450, 30],

    // Floating icy platforms
    [200, 450, 100, 20],
    [380, 370, 100, 20],
    [570, 450, 100, 20],
    [750, 350, 100, 20],
    [950, 440, 100, 20],
    [1130, 340, 100, 20],
    [1320, 430, 100, 20],
    [1510, 330, 100, 20],
    [1700, 420, 100, 20],
    [1890, 320, 100, 20],
    [2080, 410, 100, 20],
    [2270, 310, 100, 20],
    [2460, 400, 100, 20],
    [2650, 300, 100, 20],
    [2840, 390, 100, 20],
    [3030, 290, 100, 20],
    [3220, 380, 100, 20],
    [3410, 300, 100, 20],
    [3600, 400, 100, 20],
    [3790, 320, 100, 20],
    [3980, 430, 100, 20]
  ],

  coins: [
    [210, 420],
    [390, 340],
    [580, 420],
    [760, 320],
    [960, 410],
    [1140, 310],
    [1330, 400],
    [1520, 300],
    [1710, 390],
    [1900, 290],
    [2090, 380],
    [2280, 280],
    [2470, 370],
    [2660, 270],
    [2850, 360],
    [3040, 260]
  ],

  enemies: [
    [500, 540, 460, 620, 120, 0x66ccff],
    [900, 540, 860, 960, 130, 0x4488ff],
    [1300, 540, 1260, 1460, 130, 0x66ccff],
    [1800, 540, 1760, 1980, 140, 0x4488ff],
    [2300, 540, 2260, 2460, 140, 0x66ccff],
    [2800, 540, 2760, 2960, 150, 0x4488ff],
    [3300, 540, 3260, 3460, 140, 0x66ccff],

    [400, 340, 390, 470, 80, 0x88ddff],
    [960, 410, 950, 1030, 80, 0x88ddff],
    [1520, 300, 1510, 1590, 90, 0x88ddff],
    [2280, 280, 2270, 2350, 90, 0x88ddff]
  ],

  movingPlatforms: [
    [350, 300, 100, 120, 110],
    [900, 280, 100, 120, 120],
    [1450, 280, 100, 120, 120],
    [2000, 270, 100, 120, 130],
    [2550, 260, 100, 120, 130],
    [3100, 280, 100, 120, 120],
    [3650, 300, 100, 120, 110]
  ]
},

  {
    id: 4,
    name: "Deep Sea",
    subtitle: "Level 5",

    // 🌊 Underwater: light from the surface fading into dark blue, rising bubbles (see src/utils/Backdrops.js).
    // Enemies here are fish: they SWIM at their own height instead of walking on the ground.
    theme: "sea",
    background: [0x0d6aa0, 0x0d6aa0, 0x03264f, 0x021a38],
    groundColor: 0x9c8457,     // sandy sea floor
    platformColor: 0x3f8f8a,   // mossy floating rocks

    worldWidth: 4800,
    playerStart: [80, 490],
    flagX: 4700,
    timeLimit: 75,

    // 🟢 Two checkpoints, each on a sea-floor section with no fish on it
    checkpoints: [1560, 3290],

    platforms: [
      // Sea floor: longer sections than the Ice Cave, with short gaps between them
      [0,    570, 400, 30],
      [520,  570, 300, 30],
      [950,  570, 300, 30],
      [1380, 570, 320, 30],   // checkpoint 1
      [1830, 570, 270, 30],
      [2230, 570, 320, 30],
      [2680, 570, 320, 30],
      [3130, 570, 320, 30],   // checkpoint 2
      [3580, 570, 320, 30],
      [4030, 570, 270, 30],
      [4420, 570, 380, 30],   // finish

      // Floating rocks: a low/high staircase all the way along
      [300,  460, 100, 20],
      [470,  370, 100, 20],
      [680,  460, 100, 20],
      [860,  350, 110, 20],
      [1060, 450, 100, 20],
      [1250, 360, 100, 20],
      [1460, 450, 100, 20],
      [1700, 350, 110, 20],
      [1900, 450, 100, 20],
      [2100, 340, 110, 20],
      [2320, 450, 100, 20],
      [2520, 350, 100, 20],
      [2740, 450, 100, 20],
      [2950, 340, 110, 20],
      [3180, 450, 100, 20],
      [3400, 350, 100, 20],
      [3620, 450, 100, 20],
      [3830, 340, 110, 20],
      [4060, 450, 100, 20],
      [4280, 360, 100, 20],
    ],

    // One coin above most floating rocks (they drop onto the rock)
    coins: [
      [350, 430],  [520, 340],  [730, 430],  [915, 320],
      [1300, 330], [1510, 420], [1755, 320], [2155, 310],
      [2370, 420], [2570, 320], [2790, 420], [3005, 310],
      [3450, 320], [3670, 420], [3885, 310], [4110, 420],
      [4330, 330], [1110, 420]
    ],

    // [x, y, patrolLeft, patrolRight, speed, colour]: y is the height the fish swims at
    enemies: [
      // ── Sea-floor fish (y 540: you meet them when walking). The left end of each section stays free: that is where you land.
      [300,  540, 220,  390,  100, 0xff7f50],
      [700,  540, 600,  800,  110, 0xffd23f],
      [1130, 540, 1030, 1230, 120, 0xff5fa2],
      [2000, 540, 1910, 2080, 120, 0x3ddc97],
      [2430, 540, 2310, 2530, 130, 0xff7f50],
      [2880, 540, 2760, 2980, 130, 0xffd23f],
      [3780, 540, 3660, 3880, 130, 0xff5fa2],
      [4200, 540, 4110, 4280, 120, 0x3ddc97],
      [4580, 540, 4500, 4640, 110, 0xff7f50],

      // ── Mid-water fish (y 475: they pass over your head, so mind them when you jump)
      [1100, 475, 980,  1220, 70, 0x00bbf9],
      [2400, 475, 2260, 2540, 75, 0x00bbf9],
      [3760, 475, 3600, 3890, 80, 0x00bbf9],

      // ── Fish guarding floating rocks (they stay above their own rock)
      [900,  330, 875,  955,  70, 0x9b5de5],
      [1740, 330, 1715, 1795, 70, 0x9b5de5],
      [2990, 320, 2965, 3045, 75, 0x9b5de5],
      [3870, 320, 3845, 3925, 75, 0x9b5de5],
    ],

    movingPlatforms: [
      [600,  290, 100, 120, 100],
      [1500, 270, 100, 120, 110],
      [2200, 280, 100, 120, 110],
      [3000, 270, 100, 120, 120],
      [3700, 280, 100, 120, 110],
      [4300, 300, 100, 100, 100],
    ]
  },

  {
    id: 5,
    name: "Night Owl",
    subtitle: "Level 6",

    // 🦉 A forest at night: dark pine silhouettes, a moon, fog drifting along the top, fireflies
    // and owls blinking in the trees (see src/utils/Backdrops.js). Enemies here are snakes.
    theme: "forest",
    background: [0x1a2240, 0x1a2240, 0x070b16, 0x05080f],
    groundColor: 0x2f4a2a,     // mossy forest floor
    platformColor: 0x6b4a2b,   // fallen logs and branches

    worldWidth: 6400,          // the longest level: about 2 minutes of play
    playerStart: [80, 490],
    flagX: 6300,
    timeLimit: 120,

    // 🟢 Two checkpoints, each on a stretch of forest floor with no snakes on it
    checkpoints: [2300, 4320],

    platforms: [
      // Forest floor: long stretches (350-400px) with short gaps between them
      [0,    570, 500, 30],
      [630,  570, 350, 30],
      [1110, 570, 400, 30],
      [1640, 570, 350, 30],
      [2120, 570, 400, 30],   // checkpoint 1
      [2650, 570, 350, 30],
      [3130, 570, 400, 30],
      [3660, 570, 350, 30],
      [4140, 570, 400, 30],   // checkpoint 2
      [4670, 570, 350, 30],
      [5150, 570, 400, 30],
      [5680, 570, 350, 30],
      [6160, 570, 240, 30],   // finish

      // Floating logs: a low/high staircase all the way along
      [300,  450, 100, 20],
      [510,  350, 110, 20],
      [720,  450, 100, 20],
      [930,  350, 110, 20],
      [1140, 450, 100, 20],
      [1350, 350, 110, 20],
      [1560, 450, 100, 20],
      [1770, 350, 110, 20],
      [1980, 450, 100, 20],
      [2190, 350, 110, 20],
      [2400, 450, 100, 20],
      [2610, 350, 110, 20],
      [2820, 450, 100, 20],
      [3030, 350, 110, 20],
      [3240, 450, 100, 20],
      [3450, 350, 110, 20],
      [3660, 450, 100, 20],
      [3870, 350, 110, 20],
      [4080, 450, 100, 20],
      [4290, 350, 110, 20],
      [4500, 450, 100, 20],
      [4710, 350, 110, 20],
      [4920, 450, 100, 20],
      [5130, 350, 110, 20],
      [5340, 450, 100, 20],
      [5550, 350, 110, 20],
      [5760, 450, 100, 20],
      [5970, 350, 110, 20],
    ],

    // Coins sit on the logs (every log except one in four)
    coins: [
      [350, 420],  [565, 320],  [770, 420],  [1190, 420],
      [1405, 320], [1610, 420], [2030, 420], [2245, 320],
      [2450, 420], [2870, 420], [3085, 320], [3290, 420],
      [3710, 420], [3925, 320], [4130, 420], [4550, 420],
      [4765, 320], [4970, 420], [5390, 420], [5605, 320],
      [5810, 420],
    ],

    // [x, y, patrolLeft, patrolRight, speed, colour]: snakes drop onto the ground below them and slither along it
    enemies: [
      // ── Forest-floor snakes. The left end of each stretch stays free: that is where you land.
      [340,  540, 200,  480,  90,  0x6bbf3a],
      [830,  540, 710,  960,  100, 0xc9a227],
      [1260, 540, 1190, 1340, 100, 0xb5482f],
      [1420, 540, 1360, 1490, 110, 0x6bbf3a],
      [1820, 540, 1720, 1970, 110, 0x3fae8c],
      [2830, 540, 2730, 2980, 110, 0xc9a227],
      [3280, 540, 3210, 3360, 110, 0xb5482f],
      [3440, 540, 3380, 3510, 120, 0x6bbf3a],
      [3860, 540, 3740, 3990, 120, 0x3fae8c],
      [4860, 540, 4750, 5000, 120, 0xc9a227],
      [5300, 540, 5230, 5380, 120, 0xb5482f],
      [5460, 540, 5400, 5530, 130, 0x6bbf3a],
      [5880, 540, 5760, 6010, 130, 0x3fae8c],
      // (the finish stretch, 6160-6400, has no snakes)

      // ── Snakes curled up on high logs (they stay on their own log)
      [1400, 320, 1365, 1445, 70, 0xc9a227],
      [2660, 320, 2625, 2705, 70, 0xb5482f],
      [3920, 320, 3885, 3965, 75, 0xc9a227],
      [5180, 320, 5145, 5225, 75, 0xb5482f],
    ],

    movingPlatforms: [
      [700,  290, 100, 120, 100],
      [1600, 280, 100, 120, 110],
      [2500, 290, 100, 120, 110],
      [3400, 280, 100, 120, 120],
      [4300, 280, 100, 120, 110],
      [5200, 290, 100, 120, 120],
      [5900, 300, 100, 100, 100],
    ]
  },

  {
    id: 6,
    name: "Magma Falls",
    subtitle: "Level 7",

    // 🌋 A dangerous volcanic landscape in orange, red and black: erupting volcanoes, falls of magma,
    // smoke and embers (see src/utils/Backdrops.js). Hazards and their rules are in src/utils/Hazards.js.
    theme: "volcano",
    background: [0x0d0303, 0x3a0a06, 0xa82a0a, 0xff7a2a],   // black sky -> deep red -> orange glow of lava
    groundColor: 0x2b2420,     // basalt
    platformColor: 0x3a2e28,

    worldWidth: 5200,
    playerStart: [80, 490],
    flagX: 5100,
    timeLimit: 105,

    // 🟢 Two checkpoints, each on a stretch of rock with no enemies, lava or falling rocks
    checkpoints: [1860, 3470],

    platforms: [
      // Rock floor: every gap between these is a lava pool (see lavaPools)
      [0,    570, 480, 30],
      [600,  570, 320, 30],
      [1050, 570, 330, 30],
      [1680, 570, 380, 30],   // checkpoint 1
      [2190, 570, 310, 30],
      [2630, 570, 330, 30],
      [3280, 570, 400, 30],   // checkpoint 2
      [3810, 570, 310, 30],
      [4250, 570, 300, 30],
      [4870, 570, 330, 30],   // finish

      // Floating basalt ledges
      [300,  450, 100, 20],
      [520,  360, 110, 20],
      [760,  450, 100, 20],
      [980,  360, 100, 20],
      [1180, 450, 100, 20],
      [1760, 440, 100, 20],
      [1960, 350, 110, 20],
      [2280, 450, 100, 20],
      [2480, 360, 110, 20],
      [2720, 450, 100, 20],
      [3380, 450, 100, 20],
      [3580, 350, 110, 20],
      [3900, 450, 100, 20],
      [4100, 360, 110, 20],
      [4330, 450, 100, 20],
      [4950, 440, 100, 20],
    ],

    // 🔥 Lava pools [x, width]: touching the lava costs a life. Each fills a gap in the rock floor.
    // The three wide "lakes" are too far to jump: cross them on the collapsing platform in the middle.
    lavaPools: [
      [480, 120], [920, 130], [1380, 300], [2060, 130], [2500, 130],
      [2960, 320], [3680, 130], [4120, 130], [4550, 320],
    ],

    // 🪨 Collapsing platforms [x, y, width]: they crack when you stand on them, then fall
    // (3 s on Easy, 2.5 s on Normal, 2 s on Hard) and come back a few seconds later.
    crumblingPlatforms: [
      [1480, 500, 100],   // across lava lake 1
      [3070, 500, 100],   // across lava lake 2
      [4660, 500, 100],   // across lava lake 3
      [2850, 360, 100],   // bonus coin, up high
      [4420, 350, 100],   // bonus coin, up high
    ],

    // ☄️ Falling rocks: x positions where a rock drops (with a warning first) while you are nearby.
    // Only five, and never near a checkpoint, so the level stays fair.
    fallingRocks: [1150, 2300, 2780, 3880, 4320],

    coins: [
      [350, 420],  [575, 330],  [810, 420],  [1030, 330], [1230, 420],
      [1530, 470], [1810, 410], [2015, 320], [2330, 420], [2535, 330],
      [2900, 330], [3120, 470], [3430, 420], [3635, 320], [3950, 420],
      [4155, 330], [4470, 320], [4710, 470], [5000, 410],
    ],

    // [x, y, patrolLeft, patrolRight, speed, colour, kind]
    //   "lava"  = a lava creature that crawls along the rock (it drops onto the ground below it)
    //   "demon" = a fire demon that floats at its own height
    enemies: [
      [300,  540, 180,  460,  80,  0xff6a00, "lava"],
      [800,  540, 690,  900,  90,  0xff4500, "lava"],
      [1250, 540, 1130, 1360, 95,  0xff6a00, "lava"],
      [2350, 540, 2270, 2480, 100, 0xff4500, "lava"],
      [2850, 540, 2710, 2940, 100, 0xff6a00, "lava"],
      [4000, 540, 3890, 4100, 105, 0xff4500, "lava"],
      [4450, 540, 4330, 4530, 105, 0xff6a00, "lava"],

      [700,  450, 610,  900,  65, 0xff7a1a, "demon"],
      [1250, 450, 1060, 1370, 70, 0xffa21a, "demon"],
      [2400, 460, 2210, 2490, 70, 0xff7a1a, "demon"],
      [3950, 460, 3820, 4110, 75, 0xffa21a, "demon"],
    ],

    movingPlatforms: [
      [2000, 280, 100, 120, 90],
      [3700, 290, 100, 120, 100],
      [4580, 300, 100, 140, 90],   // a high road over lava lake 3
    ]
  }
];
