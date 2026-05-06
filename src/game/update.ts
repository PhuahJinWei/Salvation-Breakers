import {
	maybeStartNextWave,
	updateDamageNumbers,
	updateSoldier,
	updateSpawning,
} from './combat';
import type { GameState } from './types';

export function updateGame(state: GameState, dt: number): void {
	state.combatTime += dt;
	updateSpawning(dt, state);

	for (const enemy of state.enemies) enemy.update(dt, state);
	for (const bullet of state.bullets) bullet.update(dt, state);

	state.bullets = state.bullets.filter((bullet) => !bullet.dead);
	state.enemies = state.enemies.filter((enemy) => !enemy.dead);

	updateDamageNumbers(dt, state);
	updateSoldier(dt, state);
	maybeStartNextWave(state);
}
