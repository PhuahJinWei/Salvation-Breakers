export interface ShopItem {
	id: string;
	key: string;
	tier: number;
	color?: readonly string[];
	r: number | null;
	c: number | null;
}

export interface ShopPendingWave {
	n: number;
	count: number;
}

export interface ShopState {
	items: ShopItem[];
	pending: ShopPendingWave | null;
}

export interface ShapeBounds {
	cellCols: number;
	cellRows: number;
}
