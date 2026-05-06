import { GAME_STATE } from './state';
import { ctx, updateSoldierFacingIndex } from './dom';
import { computeFacingIndex } from './combat';
import { getEffectiveGameSpeedMult } from './devSpeed';
import { renderGame } from './render';
import { updateGame } from './update';
import { updateInventoryCooldownUI } from './ui';

const FIXED_UPDATE_DT = 1 / 60;
const MAX_REAL_FRAME_DT = 0.05;
const MAX_UPDATES_PER_FRAME = 120;

let accumulatedSimTime = 0;

export interface GameLoopFrameStats {
	realDt: number;
	updates: number;
	interpolation: number;
	droppedAccumulatedTime: boolean;
}

export function resetGameLoopTiming(): void {
	accumulatedSimTime = 0;
}

function sanitizeFrameDelta(rawDt: number): number {
	if (!Number.isFinite(rawDt) || rawDt <= 0) return 0;
	return Math.min(rawDt, MAX_REAL_FRAME_DT);
}

export function runGameFrame(rawDt: number): GameLoopFrameStats {
	const realDt = sanitizeFrameDelta(rawDt);
	let updates = 0;
	let droppedAccumulatedTime = false;

	if (!GAME_STATE.paused) {
		const speedMult = Math.max(0, getEffectiveGameSpeedMult());
		accumulatedSimTime += realDt * speedMult;

		while (accumulatedSimTime >= FIXED_UPDATE_DT && updates < MAX_UPDATES_PER_FRAME) {
			updateGame(GAME_STATE, FIXED_UPDATE_DT);
			accumulatedSimTime -= FIXED_UPDATE_DT;
			updates += 1;
		}

		if (updates === MAX_UPDATES_PER_FRAME && accumulatedSimTime >= FIXED_UPDATE_DT) {
			accumulatedSimTime = 0;
			droppedAccumulatedTime = true;
		}

		if (updates > 0) {
			updateSoldierFacingIndex(computeFacingIndex(GAME_STATE));
			updateInventoryCooldownUI();
		}
	}
	else {
		resetGameLoopTiming();
	}

	renderGame(ctx, GAME_STATE);

	return {
		realDt,
		updates,
		interpolation: accumulatedSimTime / FIXED_UPDATE_DT,
		droppedAccumulatedTime,
	};
}
