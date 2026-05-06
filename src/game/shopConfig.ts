export const GRID_ROWS = 9;
export const GRID_COLS = 9;
export const MINI_CELL = 35;
export const CELL = 49;
export const CELL_GAP = 3;
export const cellStep = CELL + CELL_GAP;
export const GHOST_GRID_OFFSET_X = 15;
export const GHOST_GRID_OFFSET_Y = 15;
export const GRID_MAGNET_MARGIN = cellStep;

export const num_shop_offer_base_item = 3;
export const num_shop_offer_max_item = 10;
export const shop_removal_max_use = 5;

export const REROLL_CONFIG = Object.freeze({
	basePrice: 1000,
	increment: 1000,
	freeCount: 10,
});

export const TIER_COLORS = {
	1: ['#34d399', '#059669'],
	2: ['#60a5fa', '#1d4ed8'],
	3: ['#a78bfa', '#7c3aed'],
	4: ['#facc15', '#eab308'],
} as const;

export const SHOP_TIER_CHANCE = {
	1: 50,
	2: 42,
	3: 7.5,
	4: 0.5,
} as const;
