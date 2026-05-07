import { CELL, CELL_GAP, GRID_COLS, GRID_ROWS } from './shopConfig';
import { publicAssetUrl } from './assets';

export const shopOverlay = document.getElementById('shopOverlay');
export const shopGridEl = document.getElementById('shopGrid');
export const shopOfferEl = document.getElementById('shopOffer');
export const btn_shop_close = document.getElementById('btn_shop_close');
export const btnRerollOffer = document.getElementById('btn_shop_reroll');

export const btnShopWeaponRemovalMain = document.getElementById('btnShop_weaponRemoval');
export const weaponRemovalOverlay = document.getElementById('weaponRemovalOverlay');
export const weaponRemovalOfferEl = document.getElementById('weaponRemovalOffer');
export const weaponRemovalRemovedListEl = document.getElementById('weaponRemovalRemovedList');
export const weaponRemovalConfirmBtn = document.getElementById('weaponRemovalConfirmBtn');
export const weaponRemovalCancelBtn = document.getElementById('weaponRemovalCancelBtn');
export const btn_subtitle_removal = document.querySelectorAll('.btn_subtitle_removal');

export function initializeShopGrid(): void {
	if (!shopGridEl) return;

	shopGridEl.innerHTML = '';
	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const slot = document.createElement('div');
			slot.className = 'cell';
			slot.style.position = 'absolute';
			slot.style.left = (c * (CELL + CELL_GAP)) + 'px';
			slot.style.top = (r * (CELL + CELL_GAP)) + 'px';
			slot.style.width = CELL + 'px';
			slot.style.height = CELL + 'px';
			slot.style.backgroundImage = publicAssetUrl('/img/UI/UI_shop_slot_default.png');
			slot.style.backgroundRepeat = 'no-repeat';
			slot.style.backgroundSize = '100% 100%';
			slot.style.backgroundPosition = 'center';
			shopGridEl.appendChild(slot);
		}
	}

	shopGridEl.style.width = (GRID_COLS * (CELL + CELL_GAP) - CELL_GAP) + 'px';
	shopGridEl.style.height = (GRID_ROWS * (CELL + CELL_GAP) - CELL_GAP) + 'px';
}
