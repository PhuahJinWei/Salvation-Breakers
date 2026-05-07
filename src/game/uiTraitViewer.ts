import { GAME_STATE } from './state';
import { TRAITS, type TraitDefinition } from './traits';
import { pauseTraitsGrid, traitListBox, traitOverlayViewer } from './dom';
import { publicAssetUrl } from './assets';

export function updateTraitViewer(): void {
	traitListBox.innerHTML = '';

	const groups = new Map<string, number[]>();
	for (const t of (GAME_STATE.traitsOwned || [])) {
		if (!groups.has(t.id)) groups.set(t.id, []);
		groups.get(t.id)?.push(t.tier);
	}

	if (groups.size === 0) {
		const empty = document.createElement('div');
		empty.className = 'trait-pill';
		empty.textContent = 'No traits yet.';
		traitListBox.appendChild(empty);
		return;
	}

	for (const [id, tiers] of groups) {
		const def = TRAITS.find((x) => x.id === id);
		if (!def) continue;

		const maxTier = Math.max(...tiers);
		const total = getTraitTotal(def);
		const totalTxt = formatTraitTotal(total) + '%';

		const row = document.createElement('div');
		row.className = 'trait-pill';
		row.innerHTML = '<div>' + def.desc(maxTier) + '<span>' + totalTxt + '</span></div>';
		traitListBox.appendChild(row);
	}
}

export function openTraitViewer(): void {
	updateTraitViewer();
	traitOverlayViewer.classList.remove('hidden');
}

export function closeTraitViewer(): void {
	traitOverlayViewer.classList.add('hidden');
}

export function updatePauseTraitGrid(): void {
	pauseTraitsGrid.innerHTML = '';

	const owned = GAME_STATE.traitsOwned || [];
	if (!owned.length) return;

	for (const t of owned) {
		const slot = document.createElement('div');
		slot.className = 'pause-trait-slot';
		slot.dataset.tier = String(t.tier) + ',' + t.id;

		const icon = document.createElement('div');
		icon.className = 'trait-icon';
		icon.dataset.tier = String(t.tier);

		const iconFrame = document.createElement('div');
		iconFrame.className = 'trait-icon-frame';
		icon.appendChild(iconFrame);

		const iconImg = document.createElement('div');
		iconImg.className = 'trait-icon-img';
		const def = TRAITS.find((x) => x.id === t.id);
		iconImg.style.backgroundImage = publicAssetUrl('/img/UI/trait icon/icon_' + String(def?.icon || t.id) + '.png');
		iconFrame.appendChild(iconImg);

		slot.appendChild(icon);
		pauseTraitsGrid.appendChild(slot);
	}
}

function getTraitTotal(def: TraitDefinition): number {
	if (def.buff_type === 'unique') {
		const uniqueBuffs = GAME_STATE.buffs.unique as unknown as Record<string, number>;
		return Number(uniqueBuffs[def.id] ?? 0);
	}

	const node = GAME_STATE.buffs[def.gun_type] as unknown as Record<string, number> | undefined;
	return Number(node?.[def.buff_type] ?? 0);
}

function formatTraitTotal(value: number): string {
	const rounded = Math.round(Number(value || 0) * 100) / 100;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
