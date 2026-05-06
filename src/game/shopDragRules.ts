import { num_shop_offer_max_item } from './shopConfig';
import type { ShopItem } from './shopTypes';

export type ShopDragSource = 'grid' | 'offer';

export interface DragStartPosition {
	r: number | null;
	c: number | null;
}

export interface OfferDropRuleInput {
	dragFrom: ShopDragSource | null;
	offerCountWithoutItem: number;
	placedCount: number;
	maxOfferItems?: number;
}

export function shouldReturnDraggedGridItemToStart({
	dragFrom,
	offerCountWithoutItem,
	placedCount,
	maxOfferItems = num_shop_offer_max_item,
}: OfferDropRuleInput): boolean {
	if (dragFrom !== 'grid') return false;
	return offerCountWithoutItem >= maxOfferItems || placedCount <= 1;
}

export function applyOfferDropFallback(
	item: ShopItem,
	startPos: DragStartPosition | null,
	input: OfferDropRuleInput,
): 'returned-to-grid' | 'moved-to-offer' {
	if (shouldReturnDraggedGridItemToStart(input)) {
		if (startPos) {
			item.r = startPos.r;
			item.c = startPos.c;
		}
		return 'returned-to-grid';
	}

	item.r = null;
	item.c = null;
	return 'moved-to-offer';
}
