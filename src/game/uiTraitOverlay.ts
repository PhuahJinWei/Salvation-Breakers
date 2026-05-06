import { SFX_BTN_TRAIT_CARD, SFX_OVERLAY_APPEAR_TRAIT, SFX_PAUSE_BGM, SFX_PLAY_BGM } from './audio';
import { traitCardsBox, traitOverlay, traitStart } from './dom';
import { GAME_STATE } from './state';
import { TRAITS, TRAIT_BASE_CARD_COUNT, TRAIT_EXTRA_CARD_CHANCE, pickTierForLevel } from './traits';
import { refreshWeaponTimingsFromSnapshots, snapshotWeaponTimingsForType } from './weaponRuntime';
import { updatePauseTraitGrid, updateTraitViewer } from './uiTraitViewer';

const traitUiState: {
	selected: { id: string; tier: number } | null;
	overlayOpen: boolean;
	queue: number;
} = {
	selected: null,
	overlayOpen: false,
	queue: 0,
};

export function resetTraitUiState(): void {
	traitUiState.selected = null;
	traitUiState.overlayOpen = false;
	traitUiState.queue = 0;
}

export function hasPendingTraitChoices(): boolean {
	return traitUiState.overlayOpen || traitUiState.queue > 0;
}

export function openTraitOverlay(): void {
	traitUiState.overlayOpen = true;
	GAME_STATE.paused = true;

	SFX_PAUSE_BGM();
	SFX_OVERLAY_APPEAR_TRAIT();

	const count = TRAIT_BASE_CARD_COUNT + (Math.random() < TRAIT_EXTRA_CARD_CHANCE ? 1 : 0);
	const offer: Array<{ id: string; tier: number }> = [];
	const usedPairs = new Set<string>();
	let guard = 200;

	while (offer.length < count && guard-- > 0) {
		const def = TRAITS[(Math.random() * TRAITS.length) | 0];
		const tier = pickTierForLevel(GAME_STATE.player.level);
		const key = def.id + '|' + tier;

		if (usedPairs.has(key)) continue;

		offer.push({ id: def.id, tier });
		usedPairs.add(key);
	}

	traitUiState.selected = null;

	traitCardsBox.innerHTML = '';
	traitCardsBox.classList.add('trait-vertical');
	offer.forEach((o) => {
		const def = TRAITS.find((x) => x.id === o.id);
		if (!def) return;

		const card = document.createElement('div');
		card.className = 'trait-card';
		card.dataset.tier = String(o.tier);

		const radio = document.createElement('div');
		radio.className = 'trait-radio';
		const radioImg = document.createElement('div');
		radioImg.className = 'trait-radio-img';
		radio.appendChild(radioImg);

		const icon = document.createElement('div');
		icon.className = 'trait-icon';
		icon.dataset.tier = String(o.tier);

		const iconFrame = document.createElement('div');
		iconFrame.className = 'trait-icon-frame';
		icon.appendChild(iconFrame);

		const iconImg = document.createElement('div');
		iconImg.className = 'trait-icon-img';
		iconImg.style.backgroundImage = 'url("/img/UI/trait icon/icon_' + String(def.icon || o.id) + '.png")';
		iconFrame.appendChild(iconImg);

		const body = document.createElement('div');
		body.className = 'trait-text';
		const title = document.createElement('div');
		title.className = 'trait-title';
		title.textContent = def.name(o.tier);

		const desc = document.createElement('div');
		desc.className = 'trait-desc';
		desc.innerHTML = def.desc(o.tier) + '<span class="accent">' + def.scaling(o.tier) + '%' + '</span>';

		body.appendChild(title);
		body.appendChild(desc);
		card.appendChild(radio);
		card.appendChild(icon);
		card.appendChild(body);

		card.addEventListener('click', () => {
			traitCardsBox.querySelectorAll('.trait-card.selected').forEach((el) => el.classList.remove('selected'));
			card.classList.add('selected');
			traitUiState.selected = { id: o.id, tier: o.tier };
			traitStart.classList.toggle('disabled', false);
			SFX_BTN_TRAIT_CARD();
		});

		traitCardsBox.appendChild(card);
	});
	traitCardsBox.style.gridTemplateColumns = `repeat(${offer.length}, 1fr)`;
	traitOverlay.classList.remove('hidden');

	if (!traitStart._wired) {
		traitStart._wired = true;
		traitStart.addEventListener('click', onTraitStartConfirm);
	}
}

export function closeTraitOverlay(): void {
	traitUiState.overlayOpen = false;
	traitOverlay.classList.add('hidden');
	traitStart.classList.toggle('disabled', true);

	traitUiState.queue = Math.max(0, traitUiState.queue - 1);
	if (traitUiState.queue > 0) {
		openTraitOverlay();
		return;
	}

	maybeResumeGameIfNoOverlays();
}

export function onTraitStartConfirm(): void {
	if (!traitUiState.selected) return;

	const { id, tier } = traitUiState.selected;
	applyTrait(id, tier);

	traitUiState.selected = null;
	traitStart.disabled = true;
	closeTraitOverlay();
}

export function maybeResumeGameIfNoOverlays(): void {
	const anyShopOpen = !document.getElementById('shopOverlay')?.classList.contains('hidden');
	const anyTraitOpen = traitUiState.overlayOpen;
	const traitStillQueued = traitUiState.queue > 0;

	if (anyShopOpen || anyTraitOpen || traitStillQueued) {
		GAME_STATE.paused = true;
		SFX_PAUSE_BGM();
		return;
	}

	GAME_STATE.paused = false;
	SFX_PLAY_BGM();
}

export function enqueueTraitChoice(n = 1): void {
	traitUiState.queue += n;
	if (!traitUiState.overlayOpen) openTraitOverlay();
}

export function applyTrait(id: string, tier: number): void {
	const def = TRAITS.find((t) => t.id === id);
	if (!def) return;

	const timingSnapshots = def.buff_type === 'cdr_up'
		? snapshotWeaponTimingsForType(def.gun_type)
		: null;

	def.apply(tier);
	if (timingSnapshots) refreshWeaponTimingsFromSnapshots(timingSnapshots);

	GAME_STATE.traitsOwned.push({ id, name: def.name, tier });

	updateTraitViewer();
	updatePauseTraitGrid();
}
