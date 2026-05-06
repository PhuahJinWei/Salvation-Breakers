import { SFX_ERROR } from './audio';
import { GAME_STATE } from './state';
import { MINI_CELL, shop_removal_max_use } from './shopConfig';
import {
	btnShopWeaponRemovalMain,
	btn_subtitle_removal,
	weaponRemovalCancelBtn,
	weaponRemovalConfirmBtn,
	weaponRemovalOfferEl,
	weaponRemovalOverlay,
	weaponRemovalRemovedListEl,
} from './shopElements';
import { createGunShapeElement, getShopOfferItemScale, updateShopOfferLayout } from './shopGunView';
import { shopState } from './shopState';
import type { ShopItem } from './shopTypes';

let weaponRemovalSelectedItem: ShopItem | null = null;
let renderOfferCallback: (() => void) | null = null;
let isBound = false;

export function configureWeaponRemoval(renderOffer: () => void): void {
	renderOfferCallback = renderOffer;
	bindWeaponRemovalEvents();
	updateRemovalSubtitle();
}

export function updateRemovalSubtitle(): void {
	btn_subtitle_removal.forEach((el) => {
		el.textContent = String(GAME_STATE.shop.removal_count);
	});
}

function openWeaponRemovalOverlay(): void {
	const offerItems = shopState.items.filter((it) => it.r == null && it.c == null);
	if (!offerItems.length || GAME_STATE.shop.removal_count <= 0) {
		SFX_ERROR();
		return;
	}

	weaponRemovalSelectedItem = null;
	updateRemovalSubtitle();
	renderWeaponRemovalOffer();
	renderWeaponRemovalRemovedList(weaponRemovalRemovedListEl);

	weaponRemovalOverlay?.classList.remove('hidden');
}

function closeWeaponRemovalOverlay(): void {
	weaponRemovalOverlay?.classList.add('hidden');
	weaponRemovalOverlay?.classList.remove('visible');
	weaponRemovalSelectedItem = null;
}

function renderWeaponRemovalOffer(): void {
	if (!weaponRemovalOfferEl) return;
	const offerEl = weaponRemovalOfferEl;
	offerEl.innerHTML = '';
	offerEl.classList.add('shop-offer-main');

	const offerItems = shopState.items.filter((it) => it.r == null && it.c == null);
	const offerItemScale = getShopOfferItemScale(offerItems.length, offerEl);
	updateShopOfferLayout(offerEl, offerItems.length);

	for (const it of offerItems) {
		const slot = document.createElement('div');
		slot.className = 'shop-offer-slot';

		const chip = createGunShapeElement(it.key, it.tier, MINI_CELL * offerItemScale, 'gun-chip');
		chip.dataset.id = it.id;
		chip.addEventListener('click', () => {
			weaponRemovalSelectedItem = it;
			offerEl.querySelectorAll('.gun-chip').forEach((el) => {
				el.classList.remove('weapon-removal-selected');
			});
			chip.classList.add('weapon-removal-selected');
		});

		slot.appendChild(chip);
		offerEl.appendChild(slot);
	}
}

export function renderWeaponRemovalRemovedList(element: HTMLElement | null): void {
	if (!element) return;
	element.innerHTML = '';

	const keysAll = Array.from(GAME_STATE.shop.removal_set);
	const count = Math.min(keysAll.length, shop_removal_max_use);
	if (!count) return;

	const itemScale = getShopOfferItemScale(count, element);
	updateShopOfferLayout(element, count);

	for (let i = 0; i < count; i++) {
		const key = keysAll[i];
		const slot = document.createElement('div');
		slot.className = 'weapon-removal-removed-slot';

		const itemDiv = createGunShapeElement(key, 1, MINI_CELL * itemScale, 'weapon-removal-removed-item');
		slot.appendChild(itemDiv);
		element.appendChild(slot);
	}
}

function confirmWeaponRemoval(): void {
	if (GAME_STATE.shop.removal_count <= 0) return;
	if (!weaponRemovalSelectedItem) return;

	const { id, key } = weaponRemovalSelectedItem;
	if (!GAME_STATE.shop.removal_set.has(key)) {
		GAME_STATE.shop.removal_set.add(key);
		GAME_STATE.shop.removal_count -= 1;
		updateRemovalSubtitle();
	}

	shopState.items = shopState.items.filter((it) => it.id !== id);

	renderOfferCallback?.();
	renderWeaponRemovalOffer();
	renderWeaponRemovalRemovedList(weaponRemovalRemovedListEl);
	closeWeaponRemovalOverlay();
}

function bindWeaponRemovalEvents(): void {
	if (isBound) return;
	isBound = true;

	btnShopWeaponRemovalMain?.addEventListener('click', openWeaponRemovalOverlay);
	weaponRemovalCancelBtn?.addEventListener('click', closeWeaponRemovalOverlay);
	weaponRemovalConfirmBtn?.addEventListener('click', confirmWeaponRemoval);
}
