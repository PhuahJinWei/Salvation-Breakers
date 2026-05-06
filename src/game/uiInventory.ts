import { GAME_STATE } from './state';

export function renderInventory(): void {
	const invGrid = document.getElementById('inventoryGrid');
	if (!invGrid) return;

	invGrid.innerHTML = '';

	for (let i = 0; i < 16; i++) {
		const item = GAME_STATE.inventory[i];
		const d = document.createElement('div');
		d.className = 'slot' + (item ? ' filled' : '');

		if (item) {
			const bg = document.createElement('img');
			bg.className = 'slot-layer slot-bg';
			bg.alt = 'tier background';
			bg.src = `/img/UI_battlefield_inventory_slot_background_tier_${item.tier ?? 1}.png`;
			bg.draggable = false;
			bg.addEventListener('dragstart', (e) => e.preventDefault());
			d.appendChild(bg);

			const gun = document.createElement('img');
			gun.className = 'slot-layer slot-gun';
			gun.src = '/img/item/icon/icon_gun_' + String(item.key) + '.png';
			gun.draggable = false;
			gun.addEventListener('dragstart', (e) => e.preventDefault());
			d.appendChild(gun);

			const cd = document.createElement('div');
			cd.className = 'slot-layer slot-cd';
			cd.dataset.wi = String(i);
			d.appendChild(cd);
		}

		invGrid.appendChild(d);
	}
}

export function updateInventoryCooldownUI(): void {
	const grid = document.getElementById('inventoryGrid');
	if (!grid || !GAME_STATE.weapons) return;

	const cds = grid.querySelectorAll<HTMLElement>('.slot-cd');
	cds.forEach((el) => {
		const wi = Number(el.dataset.wi ?? -1);
		const w = GAME_STATE.weapons?.[wi];
		if (!w) { el.style.opacity = '0'; return; }

		const busy = w.mode === 'burst' || w.mode === 'cooldown';
		const lockoutTotal = w.lockoutTotal || 0;
		if (busy && lockoutTotal > 0) {
			const frac = (w.lockoutElapsed || 0) / lockoutTotal;
			el.style.opacity = '1';
			el.style.setProperty('--cd', String(Math.max(0, Math.min(1, frac))));
		}
		else {
			el.style.opacity = '0';
			el.style.setProperty('--cd', '0');
		}
	});
}
