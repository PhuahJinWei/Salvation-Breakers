import { ensureBgmPlaying, SFX_BTN_PAUSE, SFX_GAMEOVER, SFX_PAUSE_BGM, SFX_PLAY_BGM } from './audio';
import { BARRICADE_HP_MAX, CURRENT_WAVE, SPEED_STORAGE_KEY } from './config';
import { coinNumEl, expFill, gameoverOverlay, levelNumEl, overlay_pause_removal_list, pauseOverlay, scoreNumEl, speedBtn } from './dom';
import { GAME_STATE, resetGameState } from './state';
import { waveCountFor } from './utils';
import { renderInventory } from './uiInventory';
import { uiCallbacks } from './uiCallbacks';
import { resetTraitUiState } from './uiTraitOverlay';
import { updatePauseTraitGrid, updateTraitViewer } from './uiTraitViewer';

export function show_pauseOverlay(): void {
	updatePauseTraitGrid();
	uiCallbacks.renderWeaponRemovalRemovedList(overlay_pause_removal_list);
	SFX_BTN_PAUSE();
	GAME_STATE.paused = true;
	SFX_PAUSE_BGM();
	pauseOverlay.classList.remove('hidden');
}

export function hidden_pauseOverlay(): void {
	GAME_STATE.paused = false;
	SFX_PLAY_BGM();
	pauseOverlay.classList.add('hidden');
}

export function show_gameoverOverlay(): void {
	const fmt = (n: number) => Number(n).toLocaleString('en-US');

	SFX_GAMEOVER();
	GAME_STATE.paused = true;
	SFX_PAUSE_BGM();

	const container = document.getElementById('gameover_scoreboard_list');
	if (!container) return;

	container.innerHTML = '';

	const rows = [
		{ title: 'Wave', score: GAME_STATE.wave },
		{ title: 'Enemies Killed', score: GAME_STATE.kills },
		{ title: 'Total Gold Earned', score: '0' },
		{ title: 'Gold Spent', score: '0' },
		{ title: 'Remaining Gold', score: GAME_STATE.coins },
	];

	rows.forEach((row) => {
		const rowDiv = document.createElement('div');
		const titleDiv = document.createElement('div');
		const scoreDiv = document.createElement('div');

		rowDiv.className = 'gameover-scoreboard-row';
		titleDiv.className = 'gameover-scoreboard-title';
		scoreDiv.className = 'gameover-scoreboard-score';

		titleDiv.textContent = row.title;
		scoreDiv.textContent = String(row.score ?? 0);

		rowDiv.appendChild(titleDiv);
		rowDiv.appendChild(scoreDiv);
		container.appendChild(rowDiv);
	});

	const totalPoint = document.getElementById('gameover_total_point');
	if (totalPoint) totalPoint.textContent = fmt(GAME_STATE.score);

	gameoverOverlay.classList.remove('hidden');
}

export function core_game_speed(): void {
	if (speedBtn.disabled) return;

	GAME_STATE.speedMult = GAME_STATE.speedMult % 3 + 1;
	speedBtn.innerHTML = GAME_STATE.speedMult + 'x';

	try {
		localStorage.setItem(SPEED_STORAGE_KEY, String(GAME_STATE.speedMult));
	} catch (_) {}
}

export function restart(): void {
	resetGameState();

	GAME_STATE.paused = false;
	GAME_STATE.enemies.length = 0;
	GAME_STATE.bullets.length = 0;
	GAME_STATE.coins = 0;
	GAME_STATE.score = 0;
	GAME_STATE.kills = 0;
	GAME_STATE.player.level = 1;
	GAME_STATE.player.exp = 0;
	GAME_STATE.player.expToNext = 50;
	GAME_STATE.damageByGun = {};
	GAME_STATE.combatTime = 0;
	GAME_STATE.dmgNums = [];
	resetTraitUiState();

	GAME_STATE.inventory = new Array(16).fill(null);
	renderInventory();

	const saved = parseInt(localStorage.getItem(SPEED_STORAGE_KEY) || '1', 10);
	GAME_STATE.speedMult = [1, 2, 3].includes(saved) ? saved : 1;
	speedBtn.innerHTML = GAME_STATE.speedMult + 'x';

	coinNumEl.textContent = String(GAME_STATE.coins);
	scoreNumEl.textContent = '0';
	levelNumEl.textContent = '1';
	expFill.style.width = '0%';

	GAME_STATE.barricadeHP = BARRICADE_HP_MAX;
	const hpFill = document.getElementById('hpFill');
	const hpText = document.getElementById('hpText');
	if (hpFill) hpFill.style.width = '100%';
	if (hpText) hpText.textContent = '100%';

	GAME_STATE.traitsOwned = [];
	updateTraitViewer();
	updatePauseTraitGrid();

	ensureBgmPlaying(true);
	SFX_PLAY_BGM();
	document.querySelectorAll<HTMLElement>('.game-overlay').forEach((n) => n.classList.add('hidden'));

	uiCallbacks.openShopOverlay(CURRENT_WAVE, waveCountFor(CURRENT_WAVE), true);
}
