import { GUN_CONFIG } from './config';
import { SFX_BTN_SHOP_REROLL, SFX_ERROR } from './audio';
import { GAME_STATE } from './state';
import { REROLL_CONFIG, SHOP_TIER_CHANCE, TIER_COLORS, num_shop_offer_base_item } from './shopConfig';
import { btnRerollOffer } from './shopElements';
import { shopState } from './shopState';
import type { ShopItem } from './shopTypes';

type ShopTier = keyof typeof SHOP_TIER_CHANCE;
type TierColorKey = keyof typeof TIER_COLORS;

function pickTierForShop(): number {
	const bag = [];
	for (const tierStr in SHOP_TIER_CHANCE) {
		const tierNum = parseInt(tierStr, 10);
		const w = SHOP_TIER_CHANCE[tierNum as ShopTier] || 0;
		if (w > 0) {
			bag.push({ tier: tierNum, weight: w });
		}
	}

	let total = 0;
	for (const entry of bag) {
		total += entry.weight;
	}
	if (total <= 0) return 1;

	let roll = Math.random() * total;
	for (const entry of bag) {
		if (roll < entry.weight) return entry.tier;
		roll -= entry.weight;
	}
	return 1;
}

function hasFreeReroll(): boolean {
	return GAME_STATE.shop.reroll_count > 0;
}

function canPayForReroll(): boolean {
	return GAME_STATE.coins >= GAME_STATE.shop.reroll_price;
}

function shop_offer_updateRerollUI(): void {
	const fmt = (n: number) => Number(n).toLocaleString('en-US');
	const labelEl = document.querySelector('#btn_shop_reroll .subtitle-label');
	const valueEl = document.getElementById('subtitle_btn_shop_reroll');
	if (!labelEl || !valueEl || !btnRerollOffer) return;

	if (hasFreeReroll()) {
		labelEl.classList.remove('is-coin');
		labelEl.textContent = 'Remaining attempt(s):';

		valueEl.textContent = String(GAME_STATE.shop.reroll_count);
		btnRerollOffer.classList.remove('disabled');
	}
	else {
		labelEl.textContent = '';
		labelEl.classList.add('is-coin');

		valueEl.textContent = `${fmt(GAME_STATE.coins)} / ${fmt(GAME_STATE.shop.reroll_price)}`;

		const disabled = !canPayForReroll();
		btnRerollOffer.classList.toggle('disabled', disabled);
	}
}

function shop_offer_addNewOffers(): void {
	shopState.items = shopState.items.filter((it) => it.r != null && it.c != null);
	for (let i = 0; i < num_shop_offer_base_item; i++) {
		shopState.items.push(shop_offer_makeOfferItem());
	}
}

function shop_offer_makeOfferItem(): ShopItem {
	const allKeys = Object.keys(GUN_CONFIG);
	let availableKeys = allKeys.filter((k) => !GAME_STATE.shop.removal_set.has(k));
	if (!availableKeys.length) {
		availableKeys = allKeys;
	}
	const key = availableKeys[(Math.random() * availableKeys.length) | 0];
	const tier = pickTierForShop();
	const colorPair = TIER_COLORS[tier as TierColorKey] || TIER_COLORS[1];

	return {
		id: 'itm_' + Math.random().toString(36).slice(2, 8),
		key,
		tier,
		color: colorPair,
		r: null,
		c: null,
	};
}

export function shop_offer_rerollItem(isButton = false, renderOffer: () => void): void {
	if (isButton) {
		const hasFree = hasFreeReroll();
		const canPay = canPayForReroll();

		if (!hasFree && !canPay) {
			shop_offer_updateRerollUI();
			SFX_ERROR();
			return;
		}

		if (hasFreeReroll()) {
			GAME_STATE.shop.reroll_count -= 1;
		}
		else {
			GAME_STATE.coins -= GAME_STATE.shop.reroll_price;
			GAME_STATE.shop.reroll_price += REROLL_CONFIG.increment;
		}
	}

	shop_offer_addNewOffers();
	renderOffer();
	shop_offer_updateRerollUI();

	SFX_BTN_SHOP_REROLL();
}
