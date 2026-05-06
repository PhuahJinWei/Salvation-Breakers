import { root } from './dom';
import { num_shop_offer_base_item } from './shopConfig';

export function initializeShopCssVars(): void {
	root.style.setProperty('--shop-gun-offer-count', String(num_shop_offer_base_item));
	root.style.setProperty('--shop-gun-offer-rows', '1');
}
