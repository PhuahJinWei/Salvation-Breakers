import { GUN_CONFIG } from './config';
import { dpsList, dpsOverlay } from './dom';
import { GAME_STATE } from './state';

export function updateDpsOverlay(): void {
	const fmt = (n: number | string) => Number(n).toLocaleString('en-US');
	const dmgMap = GAME_STATE.damageByGun || {};
	const entries = Object.entries(dmgMap).filter(([, dmg]) => dmg > 0);
	dpsList.innerHTML = '';
	if (entries.length === 0) return;

	entries.sort((a, b) => b[1] - a[1]);
	const maxDamage = entries[0][1] || 1;

	for (const [key, dmg] of entries) {
		const pct = Math.max(4, Math.min(100, (dmg / maxDamage) * 100));
		const row = document.createElement('div');
		row.className = 'dps-card';
		row.innerHTML = `
			<div class="dps-card-icon overlay-background-stripe"><img src="/img/item/icon/icon_gun_${key}.png"></div>
			<div class="dps-card-detail">
				<div class="dps-card-header">
					<span class="dps-name">${GUN_CONFIG[key].name}</span>
					<span class="dps-damage">${fmt(dmg.toFixed(0))}</span>
				</div>
				<div class="dps-bar">
					<div class="dps-bar-fill" style="width:${pct}%;"></div>
				</div>
			</div>
		`;
		dpsList.appendChild(row);
	}
}

export function openDpsOverlay(): void {
	updateDpsOverlay();
	dpsOverlay.classList.remove('hidden');
}

export function closeDpsOverlay(): void {
	dpsOverlay.classList.add('hidden');
}
