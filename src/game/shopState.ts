import type { ShopState } from './shopTypes';

export const shopState: ShopState = {
	items: [],
	pending: null,
};

export const mergeHighlightSet = new Set<string>();
