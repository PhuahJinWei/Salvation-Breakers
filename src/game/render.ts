import { H, W } from './config';
import { drawBarrage, drawDamageNumbers, drawSoldier } from './combat';
import { drawEnemyHitboxDebug } from './devDebug';
import type { GameState } from './types';

export function renderGame(renderCtx: CanvasRenderingContext2D, state: GameState): void {
	renderCtx.clearRect(0, 0, W, H);
	drawBarrage(renderCtx);

	for (const enemy of state.enemies) enemy.draw(renderCtx);
	for (const bullet of state.bullets) bullet.draw(renderCtx);

	drawDamageNumbers(renderCtx, state);
	drawSoldier(renderCtx, state);
	drawEnemyHitboxDebug(renderCtx, state);
}
