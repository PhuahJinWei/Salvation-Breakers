import { getEnemyProjectileHitbox } from './enemySprites';
import type { GameState } from './types';

// Test-only debug hook. Remove this file and its render import to strip the overlay.
export const DEV_HITBOX_DEBUG_ENABLED = true;

let enemyHitboxDebugVisible = false;

if (DEV_HITBOX_DEBUG_ENABLED) {
	window.addEventListener('keydown', (event) => {
		if (event.repeat) return;
		if (event.shiftKey && event.code === 'KeyH') {
			enemyHitboxDebugVisible = !enemyHitboxDebugVisible;
		}
	});
}

export function drawEnemyHitboxDebug(ctx: CanvasRenderingContext2D, state: GameState): void {
	if (!DEV_HITBOX_DEBUG_ENABLED || !enemyHitboxDebugVisible) return;

	ctx.save();
	for (const enemy of state.enemies) {
		if (enemy.dead) continue;

		const projectileHitbox = getEnemyProjectileHitbox(enemy);

		ctx.lineWidth = 2;
		ctx.strokeStyle = 'rgba(34, 197, 94, 0.95)';
		ctx.strokeRect(projectileHitbox.x, projectileHitbox.y, projectileHitbox.w, projectileHitbox.h);

		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
		ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);
	}
	ctx.restore();
}
