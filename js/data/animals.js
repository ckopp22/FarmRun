// Placeholder values; balance in the economy phase.
// k: 'quad' (w,h,l body size; leg, neck, ear heights; c body, hc head, sn snout, tc tail, x extra boxes)
//    'bird' (s scale; c body, b beak, tc tail, plume)
export const ANIMALS = [
  { id: 'chicken', name: 'Chicken', tier: 'Common', value: 10, k: 'bird', s: 1, c: 0xffffff, b: 0xf39c12, tc: 0xeeeeee, crest: 0xd62d20 },
  { id: 'duck', name: 'Duck', tier: 'Common', value: 25, k: 'bird', s: 0.9, c: 0xf5e8a0, b: 0xf39c12, tc: 0xe0d08a },
  { id: 'rabbit', name: 'Rabbit', tier: 'Common', value: 50, k: 'quad', w: 0.35, h: 0.3, l: 0.5, leg: 0.12, ear: 0.4, c: 0xd9c7b0, tc: 0xffffff },
  { id: 'goat', name: 'Goat', tier: 'Uncommon', value: 100, k: 'quad', w: 0.45, h: 0.5, l: 0.8, leg: 0.45, ear: 0.12, c: 0xe8e0d0,
    x: [[0.06, 0.22, 0.06, 0x8a7a5a, -0.1, 1.2, 0.5], [0.06, 0.22, 0.06, 0x8a7a5a, 0.1, 1.2, 0.5]] },
  { id: 'sheep', name: 'Sheep', tier: 'Uncommon', value: 200, k: 'quad', w: 0.7, h: 0.6, l: 0.9, leg: 0.35, ear: 0.1, c: 0xf4f4f4, hc: 0x333333 },
  { id: 'pig', name: 'Pig', tier: 'Uncommon', value: 500, k: 'quad', w: 0.6, h: 0.55, l: 0.9, leg: 0.25, ear: 0.12, c: 0xf2a6b5, sn: 0xe58a9d },
  { id: 'cow', name: 'Cow', tier: 'Rare', value: 1000, k: 'quad', w: 0.9, h: 0.8, l: 1.5, leg: 0.6, ear: 0.12, c: 0xffffff, sn: 0xf2b6b6,
    x: [[0.92, 0.35, 0.5, 0x222222, 0, 1.15, -0.2], [0.5, 0.3, 0.4, 0x222222, 0.3, 1.5, 0.4]] },
  { id: 'llama', name: 'Llama', tier: 'Rare', value: 2500, k: 'quad', w: 0.6, h: 0.7, l: 1.0, leg: 0.7, neck: 0.6, ear: 0.25, c: 0xe9dcc0 },
  { id: 'horse', name: 'Horse', tier: 'Rare', value: 5000, k: 'quad', w: 0.6, h: 0.75, l: 1.5, leg: 0.85, neck: 0.5, ear: 0.18, c: 0x8b5a2b, tc: 0x3b2410,
    x: [[0.1, 0.5, 0.15, 0x3b2410, 0, 1.95, 0.65]] },
  { id: 'alpaca', name: 'Alpaca', tier: 'Epic', value: 10000, k: 'quad', w: 0.55, h: 0.65, l: 0.9, leg: 0.6, neck: 0.55, ear: 0.22, c: 0xcaa57a },
  { id: 'peacock', name: 'Peacock', tier: 'Epic', value: 25000, k: 'bird', s: 1.3, c: 0x1f6fb5, b: 0xf0c040, tc: 0x1a9a6a, plume: true },
  { id: 'highland', name: 'Highland Cow', tier: 'Epic', value: 50000, k: 'quad', w: 1, h: 0.9, l: 1.5, leg: 0.5, ear: 0.15, c: 0xb5651d, sn: 0x6b3a10,
    x: [[0.08, 0.3, 0.08, 0xf3e9c7, -0.4, 1.7, 0.7], [0.08, 0.3, 0.08, 0xf3e9c7, 0.4, 1.7, 0.7]] },
  { id: 'goose', name: 'Golden Goose', tier: 'Legendary', value: 100000, k: 'bird', s: 1.2, c: 0xffd24a, b: 0xf39c12, tc: 0xe6b422 },
  { id: 'unicorn', name: 'Unicorn Pony', tier: 'Legendary', value: 250000, k: 'quad', w: 0.6, h: 0.7, l: 1.3, leg: 0.7, neck: 0.4, ear: 0.15, c: 0xffffff, tc: 0xff7ac8,
    x: [[0.08, 0.45, 0.08, 0xffd700, 0, 2.0, 0.85], [0.1, 0.45, 0.15, 0xff7ac8, 0, 1.6, 0.5]] },
];

export const UPGRADES = [
  'Bigger Bag', 'Running Shoes', 'Better Truck', 'Animal Lure',
  'Scout Binoculars', 'Barn Expansion', 'New Woods Zones',
];
