import { TIER_COLORS } from './shopConfig';
import { getShapeCellsAt } from './shopPlacement';
import { shopState } from './shopState';
import type { ShopItem } from './shopTypes';

type TierColorKey = keyof typeof TIER_COLORS;

export interface GridDropResult {
	merged: boolean;
}

export function countPlaced(items: ShopItem[] = shopState.items): number {
	return items.filter((it) => it.r != null && it.c != null).length;
}

export function getCurrentCells(item: ShopItem): Array<[number, number]> {
	if (item.r == null || item.c == null) return [];
	return getShapeCellsAt(item, item.r, item.c);
}

export function overlappingItemsAt(
	items: ShopItem[],
	item: ShopItem,
	placeR: number,
	placeC: number,
): ShopItem[] {
	const hits = new Set<ShopItem>();
	const newCells = getShapeCellsAt(item, placeR, placeC).map(([rr, cc]) => rr + ',' + cc);

	for (const other of items) {
		if (other === item) continue;
		if (other.r == null || other.c == null) continue;

		for (const [orow, ocol] of getCurrentCells(other)) {
			if (newCells.includes(orow + ',' + ocol)) {
				hits.add(other);
				break;
			}
		}
	}

	return [...hits];
}

export function canMergeItems(a: ShopItem | null | undefined, b: ShopItem | null | undefined): boolean {
	if (!a || !b) return false;
	if (a.key !== b.key) return false;
	if (a.tier !== b.tier) return false;
	return a.tier < 4;
}

export function mergeIntoTarget(target: ShopItem, source: ShopItem): void {
	target.tier = Math.min(4, target.tier + 1);
	applyTierColor(target);
	shopState.items = shopState.items.filter((it) => it !== source);
}

export function resolveDropOnGrid(item: ShopItem, newR: number, newC: number): GridDropResult {
	const overlaps = overlappingItemsAt(shopState.items, item, newR, newC);
	const mergeTarget = overlaps.find((other) => canMergeItems(item, other));

	if (mergeTarget) {
		mergeIntoTarget(mergeTarget, item);
		return { merged: true };
	}

	for (const other of overlaps) {
		other.r = null;
		other.c = null;
	}

	item.r = newR;
	item.c = newC;
	return { merged: false };
}

export function applyTierColor(item: ShopItem): void {
	const tier = Math.min(item.tier, 4) as TierColorKey;
	item.color = TIER_COLORS[tier] || TIER_COLORS[1];
}
