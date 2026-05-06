import { SFX_BTN_SHOP_CLOSE, SFX_OVERLAY_APPEAR_SHOP, SFX_PAUSE_BGM, SFX_PLAY_BGM } from './audio';
import { startWave } from './combat';
import { GAME_STATE, makeWeaponInstance } from './state';
import { TIER_COLORS } from './shopConfig';
import { btnRerollOffer, btn_shop_close, shopOverlay } from './shopElements';
import { shop_offer_rerollItem } from './shopOffers';
import { updateRemovalSubtitle } from './shopRemoval';
import { shopState } from './shopState';
import { hasPendingTraitChoices, renderInventory } from './ui';

interface ShopOverlayDeps {
	renderPlaced: () => void;
	renderOffer: () => void;
}

let deps: ShopOverlayDeps | null = null;
let eventsBound = false;

export function configureShopOverlay(nextDeps: ShopOverlayDeps): void {
	deps = nextDeps;
	bindShopOverlayEvents();
}

export function openShopOverlay(
	nextWave: number,
	nextCount: number,
	initial = false,
	view = false,
	state = GAME_STATE,
): void {
	if (!deps) throw new Error('Shop overlay was opened before configuration.');

	shopState.pending = { n: nextWave, count: nextCount };
	state.paused = true;
	console.log('[shopOverlay] GAME_STATE', state);
	SFX_PAUSE_BGM();
	SFX_OVERLAY_APPEAR_SHOP();

	if (initial) {
		shopState.items = [{
			id: 'itm_starter',
			key: 'submachinegun',
			tier: 1,
			color: TIER_COLORS[1],
			r: 0,
			c: 0,
		}];
	}

	updateRemovalSubtitle();
	deps.renderPlaced();
	shopOverlay?.classList.remove('hidden');

	if (!view) shop_offer_rerollItem(false, deps.renderOffer);
	setShopViewMode(view);
}

export function closeShopOverlayAndStart(): void {
	const placed = shopState.items.filter((it) => it.r != null && it.c != null);
	if (placed.length < 1) return;

	const state = GAME_STATE;
	state.weapons = placed.map((it) => makeWeaponInstance(it.key, it.tier));
	state.inventory = new Array(16).fill(null);

	for (let i = 0; i < placed.length && i < 16; i++) {
		state.inventory[i] = {
			key: placed[i].key,
			tier: placed[i].tier,
		};
	}

	renderInventory();
	shopOverlay?.classList.add('hidden');

	const nextWaveNum = shopState.pending?.n || (state.wave + 1);
	const nextWaveCount = shopState.pending?.count || 1;
	startWave(nextWaveNum, nextWaveCount, state);

	if (hasPendingTraitChoices()) {
		state.paused = true;
	}
	else {
		state.paused = false;
		SFX_PLAY_BGM();
	}

	SFX_BTN_SHOP_CLOSE();
}

export function closeViewInventory(): void {
	shopOverlay?.classList.add('hidden');
}

function setShopViewMode(view: boolean): void {
	document.querySelector<HTMLElement>('.shop-panel-body')?.classList.toggle('viewMode', view);
	document.getElementById('shopGrid')?.classList.toggle('viewMode', view);
	document.getElementById('shopLayoutOffer')?.classList.toggle('viewMode', view);
	document.getElementById('btn_shop_close')?.classList.toggle('viewMode', view);
	document.getElementById('btnShop_weaponRemoval')?.classList.toggle('viewMode', view);
	document.getElementById('btn_shop_reroll')?.classList.toggle('viewMode', view);
	document.getElementById('btnShop_close_view')?.classList.toggle('viewMode', !view);
}

function bindShopOverlayEvents(): void {
	if (eventsBound) return;
	eventsBound = true;

	btn_shop_close?.addEventListener('click', closeShopOverlayAndStart);
	document.getElementById('btnShop_close_view')?.addEventListener('click', closeViewInventory);
	btnRerollOffer?.addEventListener('click', () => {
		if (!deps) return;
		shop_offer_rerollItem(true, deps.renderOffer);
	});
}
