// Placeholder values; balance in the economy phase.
// k: 'quad' (w,h,l body size; leg, neck, ear heights; c body, hc head, sn snout, tc tail, x extra boxes)
//    'bird' (s scale; c body, b beak, tc tail, plume)
export const ANIMALS = [
  { id: 'chicken', name: 'Chicken', tier: 'Common', value: 10, k: 'bird', s: 1, c: 0xffffff, b: 0xf39c12, tc: 0xeeeeee, crest: 0xd62d20 },
  { id: 'duck', name: 'Duck', tier: 'Common', value: 25, k: 'bird', s: 0.9, c: 0xf5e8a0, b: 0xf39c12, tc: 0xe0d08a },
  { id: 'rabbit', name: 'Rabbit', tier: 'Common', value: 50, k: 'quad', w: 0.35, h: 0.3, l: 0.5, leg: 0.12, ear: 0.4, c: 0xd9c7b0, tc: 0xffffff },
  { id: 'goat', name: 'Goat', tier: 'Common', value: 100, k: 'quad', w: 0.45, h: 0.5, l: 0.8, leg: 0.45, ear: 0.12, c: 0xe8e0d0,
    x: [[0.06, 0.22, 0.06, 0x8a7a5a, -0.1, 1.2, 0.5], [0.06, 0.22, 0.06, 0x8a7a5a, 0.1, 1.2, 0.5]] },
  { id: 'sheep', name: 'Sheep', tier: 'Uncommon', value: 200, k: 'quad', w: 0.7, h: 0.6, l: 0.9, leg: 0.35, ear: 0.1, c: 0xf4f4f4, hc: 0x333333 },
  { id: 'fox', name: 'Fox', tier: 'Uncommon', value: 300, k: 'quad', w: 0.4, h: 0.4, l: 0.8, leg: 0.3, ear: 0.2, c: 0xe07a2f, sn: 0xffffff,
    x: [[0.2, 0.2, 0.6, 0xe07a2f, 0, 0.62, -0.7], [0.2, 0.2, 0.15, 0xffffff, 0, 0.62, -1.08]] },
  { id: 'turtle', name: 'Turtle', tier: 'Uncommon', value: 400, k: 'quad', w: 0.7, h: 0.25, l: 0.9, leg: 0.12, neck: 0.1, c: 0x6fae5a, hc: 0x7fb069,
    x: [[0.85, 0.3, 1.0, 0x6b4a2b, 0, 0.42, -0.05], [0.55, 0.15, 0.7, 0x8a6a40, 0, 0.62, -0.05]] },
  { id: 'pig', name: 'Pig', tier: 'Uncommon', value: 500, k: 'quad', w: 0.6, h: 0.55, l: 0.9, leg: 0.25, ear: 0.12, c: 0xf2a6b5, sn: 0xe58a9d },
  { id: 'raccoon', name: 'Raccoon', tier: 'Uncommon', value: 700, k: 'quad', w: 0.5, h: 0.4, l: 0.75, leg: 0.2, ear: 0.1, c: 0x8a8a8a, sn: 0x333333,
    x: [[0.36, 0.1, 0.04, 0x222222, 0, 0.62, 0.67], [0.18, 0.18, 0.5, 0x777777, 0, 0.5, -0.62], [0.19, 0.19, 0.1, 0x222222, 0, 0.5, -0.9]] },
  { id: 'deer', name: 'Deer', tier: 'Uncommon', value: 900, k: 'quad', w: 0.5, h: 0.6, l: 1.0, leg: 0.7, neck: 0.4, ear: 0.15, c: 0xb07a45, sn: 0x4a3220,
    x: [[0.05, 0.4, 0.05, 0x6b4a2b, -0.12, 2.1, 0.59], [0.05, 0.4, 0.05, 0x6b4a2b, 0.12, 2.1, 0.59]] },
  { id: 'cow', name: 'Cow', tier: 'Rare', value: 1000, k: 'quad', w: 0.9, h: 0.8, l: 1.5, leg: 0.6, ear: 0.12, c: 0xffffff, sn: 0xf2b6b6,
    x: [[0.92, 0.35, 0.5, 0x222222, 0, 1.15, -0.2], [0.5, 0.3, 0.4, 0x222222, 0.3, 1.5, 0.4]] },
  { id: 'bison', name: 'Bison', tier: 'Rare', value: 1500, k: 'quad', w: 1, h: 0.9, l: 1.5, leg: 0.5, ear: 0.12, c: 0x4a2f1c, sn: 0x2a1a10,
    x: [[0.9, 0.5, 0.7, 0x4a2f1c, 0, 1.6, 0.3], [0.08, 0.2, 0.08, 0xe8e0c8, -0.4, 1.8, 1.04], [0.08, 0.2, 0.08, 0xe8e0c8, 0.4, 1.8, 1.04]] },
  { id: 'llama', name: 'Llama', tier: 'Rare', value: 2500, k: 'quad', w: 0.6, h: 0.7, l: 1.0, leg: 0.7, neck: 0.6, ear: 0.25, c: 0xe9dcc0 },
  { id: 'zebra', name: 'Zebra', tier: 'Rare', value: 3500, k: 'quad', w: 0.6, h: 0.7, l: 1.4, leg: 0.8, neck: 0.45, ear: 0.15, c: 0xffffff, tc: 0x222222,
    x: [[0.62, 0.72, 0.1, 0x222222, 0, 1.15, -0.45], [0.62, 0.72, 0.1, 0x222222, 0, 1.15, -0.1], [0.62, 0.72, 0.1, 0x222222, 0, 1.15, 0.25], [0.1, 0.5, 0.15, 0x222222, 0, 1.9, 0.55]] },
  { id: 'horse', name: 'Horse', tier: 'Rare', value: 5000, k: 'quad', w: 0.6, h: 0.75, l: 1.5, leg: 0.85, neck: 0.5, ear: 0.18, c: 0x8b5a2b, tc: 0x3b2410,
    x: [[0.1, 0.5, 0.15, 0x3b2410, 0, 1.95, 0.65]] },
  { id: 'alpaca', name: 'Alpaca', tier: 'Epic', value: 10000, k: 'quad', w: 0.55, h: 0.65, l: 0.9, leg: 0.6, neck: 0.55, ear: 0.22, c: 0xcaa57a },
  { id: 'panda', name: 'Panda', tier: 'Epic', value: 15000, k: 'quad', w: 0.9, h: 0.8, l: 1.1, leg: 0.35, ear: 0.12, c: 0xffffff, hc: 0xf2f2f2, sn: 0x222222,
    x: [[0.94, 0.4, 0.3, 0x222222, 0, 0.75, 0.35]] },
  { id: 'peacock', name: 'Peacock', tier: 'Epic', value: 25000, k: 'bird', s: 1.3, c: 0x1f6fb5, b: 0xf0c040, tc: 0x1a9a6a, plume: true },
  { id: 'giraffe', name: 'Giraffe', tier: 'Epic', value: 35000, k: 'quad', w: 0.6, h: 0.8, l: 1.2, leg: 1.1, neck: 1.3, ear: 0.12, c: 0xe8b84a, sn: 0x8a5a20,
    x: [[0.62, 0.18, 0.18, 0x8a5a20, 0, 1.5, -0.3], [0.62, 0.18, 0.18, 0x8a5a20, 0, 1.6, 0.15], [0.34, 0.2, 0.34, 0x8a5a20, 0, 2.4, 0.5], [0.34, 0.2, 0.34, 0x8a5a20, 0, 2.9, 0.5]] },
  { id: 'highland', name: 'Highland Cow', tier: 'Epic', value: 50000, k: 'quad', w: 1, h: 0.9, l: 1.5, leg: 0.5, ear: 0.15, c: 0xb5651d, sn: 0x6b3a10,
    x: [[0.08, 0.3, 0.08, 0xf3e9c7, -0.4, 1.7, 0.7], [0.08, 0.3, 0.08, 0xf3e9c7, 0.4, 1.7, 0.7]] },
  { id: 'goose', name: 'Golden Goose', tier: 'Legendary', value: 100000, k: 'bird', s: 1.2, c: 0xffd24a, b: 0xf39c12, tc: 0xe6b422 },
  { id: 'phoenix', name: 'Phoenix', tier: 'Legendary', value: 150000, k: 'bird', s: 1.4, c: 0xff6a1a, b: 0xf0c040, tc: 0xffd23a, plume: true, crest: 0xffd23a },
  { id: 'unicorn', name: 'Unicorn Pony', tier: 'Legendary', value: 250000, k: 'quad', w: 0.6, h: 0.7, l: 1.3, leg: 0.7, neck: 0.4, ear: 0.15, c: 0xffffff, tc: 0xff7ac8,
    x: [[0.08, 0.45, 0.08, 0xffd700, 0, 2.0, 0.85], [0.1, 0.45, 0.15, 0xff7ac8, 0, 1.6, 0.5]] },
  { id: 'dragon', name: 'Dragon', tier: 'Legendary', value: 500000, k: 'quad', w: 0.8, h: 0.8, l: 1.6, leg: 0.45, neck: 0.5, c: 0x2e9e4f, hc: 0x1f7a3a, sn: 0x1f7a3a,
    x: [[0.9, 0.08, 0.7, 0x7a2a8a, -0.85, 1.5, -0.1], [0.9, 0.08, 0.7, 0x7a2a8a, 0.85, 1.5, -0.1], [0.07, 0.3, 0.07, 0xf3e9c7, -0.15, 2.18, 0.93], [0.07, 0.3, 0.07, 0xf3e9c7, 0.15, 2.18, 0.93],
      [0.2, 0.2, 0.9, 0x2e9e4f, 0, 0.7, -1.2], [0.1, 0.2, 0.1, 0xffd23a, 0, 1.35, 0.3], [0.1, 0.2, 0.1, 0xffd23a, 0, 1.35, -0.1], [0.1, 0.2, 0.1, 0xffd23a, 0, 1.35, -0.5]] },
];

// The first START_PENS animals have pens from the start; each later pen is bought in order.
export const START_PENS = 4;
export const PEN_COSTS = [250, 450, 700, 1000, 1700, 2500, 3200, 4500, 6500, 9000, 13000, 30000, 45000, 70000, 100000, 150000, 300000, 450000, 600000, 800000];

// costs[i] = price of level i+1. Effects live in systems/economy.js.
export const UPGRADES = [
  { id: 'bag', name: 'Bigger Bag', desc: '+1 carry capacity', costs: [50, 250, 1500, 10000, 60000] },
  { id: 'shoes', name: 'Running Shoes', desc: '+10% move speed', costs: [100, 600, 4000] },
];
