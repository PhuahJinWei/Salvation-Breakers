import { BARRICADE_Y, BARRICADE_HP_MAX, BOSS_A, BOSS_MINI_TO_BOSS_INTERVAL, BOSS_WARN_FLASHES, BOSS_WARN_TOTAL_DURATION, GUN_MULTITARGET_PROBILITY, GROUP_INTERVAL_BASE, GROUPS_PER_WAVE, MOB_INTERVAL_BASE, MOB_INTERVAL_DECAY_PER_WAVE, MOB_INTERVAL_MIN, MOBS, MINI_BOSS_A, W } from './config';
import { GAME_STATE } from './state';
import { Bullet, Mob, configureEntityHooks } from './entities';
import { playGunFire } from './audio';
import { bossWarn, coinNumEl, expFill, levelNumEl, scoreNumEl, waveNumEl } from './dom';
import { splitIntoGroups, waveCountFor } from './utils';
import { createWeaponProjectiles, effectivePostUseCooldown, effectiveTimeBetweenBullets, getWeaponLockoutTotal } from './weaponRuntime';
import type { EnemyConfig, EnemyRuntime, GameState } from './types';

const combatCallbacks: {
	enqueueTraitChoice: (count: number) => void;
	showGameoverOverlay: () => void;
	openShopOverlay: (nextWave: number, nextCount: number) => void;
} = {
	enqueueTraitChoice: () => {},
	showGameoverOverlay: () => {},
	openShopOverlay: () => {},
};

export function configureCombatCallbacks(callbacks: Partial<typeof combatCallbacks>): void {
	Object.assign(combatCallbacks, callbacks);
}

export function findClosestEnemy(range = Infinity, state: GameState = GAME_STATE): EnemyRuntime | null {
		const p = state.player; const r2 = range===Infinity ? Infinity : range*range;
		let best: EnemyRuntime | null = null, bestD2=Infinity;
		for (const m of state.enemies){
			if (m.dead) continue;
			const dx = p.x - m.cx, dy = p.y - m.cy, d2 = dx*dx + dy*dy;
			if (d2 < bestD2 && d2 <= r2){ bestD2=d2; best=m; }
		}
		return best;
	}

// =============== Core Game Functions =============== //
	export function computeFacingIndex(state: GameState = GAME_STATE) {
		if (state.player.aimVX != null && state.player.aimVY != null) {
			const vx = state.player.aimVX, vy = state.player.aimVY;
			const deg = Math.atan2(vx, -vy) * 180 / Math.PI; // 180..+180
			const clamped = Math.max(-90, Math.min(90, deg));
			return Math.min(4, Math.max(0, Math.floor((clamped + 90) / 36)));
		}
		const t = findClosestEnemy(Infinity, state);
		if (!t) return 2;
		const dx = t.cx - state.player.x, dy = t.cy - state.player.y;
		const deg = Math.atan2(dx, -dy) * 180 / Math.PI;
		const clamped = Math.max(-90, Math.min(90, deg));
		return Math.min(4, Math.max(0, Math.floor((clamped + 90) / 36)));
	}
	// Player
	export function drawSoldier(ctx: CanvasRenderingContext2D, state: GameState = GAME_STATE) {
		const p = state.player;
		ctx.save(); ctx.translate(p.x, p.y);
		ctx.fillStyle = '#a78bfa'; ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(0,-p.size); ctx.lineTo(p.size*.9,p.size); ctx.lineTo(-p.size*.9,p.size); ctx.closePath();
		ctx.fill(); ctx.stroke();
		const t = findClosestInRange(state);
		if (t) {
			const dx = t.cx - p.x, dy = t.cy - p.y;
			const len = Math.hypot(dx, dy) || 1; const ux = dx/len, uy = dy/len;
			ctx.beginPath(); ctx.moveTo(0, -p.size*0.5); ctx.lineTo(ux*18, uy*18 - p.size*0.5);
			ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.stroke();
		}
		ctx.restore();
	}
	export function updateSoldier(dt: number, state: GameState = GAME_STATE) {
		if (!state.weapons || state.weapons.length === 0) return;
		for (const w of state.weapons) {
			w.timer -= dt;
			
			const lockoutTotal = w.lockoutTotal || 0;
			if (lockoutTotal > 0 && (w.mode === 'burst' || w.mode === 'cooldown')) {
				w.lockoutElapsed = Math.min(lockoutTotal, (w.lockoutElapsed || 0) + dt);
			}

			if (w.mode === 'idle') {
				const nearest = findClosestEnemy(w.stats.range, state);
				if (nearest) {
					let chosen = nearest;
					if (Math.random() >= GUN_MULTITARGET_PROBILITY) {
						const p = state.player, r2 = w.stats.range*w.stats.range;
						const pool = [];
						for (const m of state.enemies) {
							if (m.dead) continue;
							const dx=p.x-m.cx, dy=p.y-m.cy, d2=dx*dx+dy*dy;
							if (d2<=r2) pool.push(m);
						}
						if (pool.length) chosen = pool[(Math.random()*pool.length)|0];
					}
					
					//update player-facing angle
					const p = state.player;
					const dx = chosen.cx - p.x, dy = chosen.cy - p.y;
					const L = Math.hypot(dx, dy) || 1;
					w.dirX = dx / L;
					w.dirY = dy / L;
					state.player.aimVX = w.dirX;
					state.player.aimVY = w.dirY;
					
					// --- fire gun ----
					w.mode = 'burst';
					w.burstLeft = w.stats.bulletsPerUse;
					w.timer = 0;
					playGunFire(w.key);
					//cooldown clock-wise
					w.lockoutTotal = getWeaponLockoutTotal(w);
					w.lockoutElapsed = 0;
				}
			}
			else if (w.mode === 'burst') 
			{
				while (w.burstLeft > 0 && w.timer <= 0) {
					if (w.dirX == null || w.dirY == null) break;

					const p = state.player;
					const projectiles = createWeaponProjectiles(w, w.dirX, w.dirY);
					for (const projectile of projectiles) {
						state.bullets.push(new Bullet(
							p.x, p.y - p.size * 0.6,
							projectile.dx, projectile.dy,
							projectile.speed, projectile.damage, projectile.isCrit,
							projectile
						));
					}
					w.burstLeft--;
					w.timer += effectiveTimeBetweenBullets(w);
				}
				//goes off cooldown
				if (w.burstLeft === 0 && w.timer <= 0) {
					w.mode = 'cooldown';
					w.timer = effectivePostUseCooldown(w);
				}
			}
			else if (w.mode === 'cooldown') {
				if (w.timer <= 0) {
					w.mode = 'idle';
					w.lockoutElapsed = 0;
					w.lockoutTotal = 0;
				}
			}
		}
	}
	export function findClosestInRange(state: GameState = GAME_STATE) {
		const ranges = (state.weapons && state.weapons.length)
		? state.weapons.map(w => w.stats.range)
		: [Infinity];
		const maxRange = Math.max(...ranges);
		return findClosestEnemy(maxRange, state);
	}
	
	//Mob
	export function onMobKilled(m: EnemyRuntime, state: GameState = GAME_STATE) {
		//add exp, coin, score, kill count
		state.player.exp += m.type.exp + Math.round((m.type.exp * ((state.buffs.unique.exp_up || 0) / 100))); // exp gain trait
		state.coins += m.type.coin + Math.round((m.type.coin * ((state.buffs.unique.gold_up || 0) / 100))); // gold gain trait
		state.score += m.type.score || 0;
		state.kills++;
		
		
		//level up
		while (state.player.exp >= state.player.expToNext) {
			state.player.exp -= state.player.expToNext;
			state.player.level += 1;
			state.player.expToNext = Math.ceil(state.player.expToNext * 1.3);
			combatCallbacks.enqueueTraitChoice(1);
		}
		
		//update scoreboard
		const fmt = (n: number) => Number(n).toLocaleString('en-US'); //add comma to digits
		coinNumEl.textContent  = String(fmt(state.coins));
		scoreNumEl.textContent = String(fmt(state.score));
		levelNumEl.textContent = String(state.player.level);
		
		//update exp bar
		const pct = Math.round((state.player.exp / state.player.expToNext) * 100);
		expFill.style.width = pct + '%';
	}
	export function computeMobIntervalForWave(wave: number): number {
		const t = Math.pow(MOB_INTERVAL_DECAY_PER_WAVE, Math.max(0, wave-1));
		return Math.max(MOB_INTERVAL_MIN, Math.min(MOB_INTERVAL_BASE, MOB_INTERVAL_BASE * t));
	}
	
	//Damage Number
	export function updateDamageNumbers(dt: number, state: GameState = GAME_STATE) {
		if (!state.dmgNums) return;
		for (const d of state.dmgNums) d.update(dt);
		state.dmgNums = state.dmgNums.filter(d => d.age < d.life);
	}
	export function drawDamageNumbers(ctx: CanvasRenderingContext2D, state: GameState = GAME_STATE) {
		if (!state.dmgNums) return;
		for (const d of state.dmgNums) d.draw(ctx);
	}
	
	
	
	//Barrage
	export function drawBarrage(ctx: CanvasRenderingContext2D): void {
		ctx.save();
		const y = BARRICADE_Y;
		ctx.beginPath(); ctx.moveTo(12,y); ctx.lineTo(W-12,y);
		ctx.restore();
	}
	export function applyBarrageDamage(dmg: number, state: GameState = GAME_STATE) {
		const maxHP = BARRICADE_HP_MAX;
		const bar = document.getElementById('hpFill');
		const txt = document.getElementById('hpText');
		state.barricadeHP = (state.barricadeHP ?? maxHP) - dmg;
		state.barricadeHP = Math.max(0, Math.min(maxHP, state.barricadeHP));
		const pct = Math.round((state.barricadeHP / maxHP) * 100);
		if (bar) bar.style.width = pct + '%';
		if (txt) txt.textContent = pct + '%';
		
		if (state.barricadeHP <= 0) combatCallbacks.showGameoverOverlay();
	}
  
	//Wave
	export function maybeStartNextWave(state: GameState = GAME_STATE) {
		if (state.groupIndex < GROUPS_PER_WAVE) return;
		const anyAlive = state.enemies.some(e => !e.dead);
		if (!anyAlive) {
			const nextCount = Math.max(1, Math.ceil(waveCountFor(state.wave + 1)));
			combatCallbacks.openShopOverlay(state.wave + 1, nextCount);
		}
	}
	export function startWave(n: number, totalCount: number, state: GameState = GAME_STATE): void {
		state.wave = n; waveNumEl.textContent = String(n);
		state.toSpawn = totalCount; state.groupIndex = 0; state.groupMobIndex = 0;
		state.specialsSpawned = false; state.specialsProgress = 0; state.specialsTimer = 0;
		state.groupIntervalTimer = 0; state.mobIntervalWave = computeMobIntervalForWave(n); state.mobIntervalTimer = 0;
		state.groupSizes = splitIntoGroups(totalCount, GROUPS_PER_WAVE);
		state.specialsQueued.mini = (n % 5 === 0);
		state.specialsQueued.boss = (n % 10 === 0);
	}
	export function spawnOneNormalMob(state: GameState = GAME_STATE) {
		const s = MOBS["A"].size;
		const x = Math.max(0, Math.min(W - s, Math.random() * (W - s)));
		const y = -s - (Math.random() * 140 + 20);
		state.enemies.push(new Mob(MOBS["A"], x, y));
	}
	export function spawnSpecial(type: EnemyConfig, state: GameState = GAME_STATE) {
		const s = type.size;
		const x = Math.max(0, Math.min(W - s, Math.random() * (W - s)));
		const y = -s - (Math.random() * 130 + 30);
		state.enemies.push(new Mob(type, x, y));
	}
	export function showBossWarning(text = "BOSS APPROACHING") {
		bossWarn.textContent = text;
		bossWarn.classList.add('show');
		const per = Math.max(0.1, BOSS_WARN_TOTAL_DURATION / Math.max(1, BOSS_WARN_FLASHES));
		bossWarn.style.animation = 'none'; void bossWarn.offsetWidth;
		bossWarn.style.animation = `warnPulse ${per}s ease-in-out ${Math.max(1, BOSS_WARN_FLASHES)}`;
		clearTimeout(bossWarn._hideTO);
		bossWarn._hideTO = setTimeout(()=>{ bossWarn.classList.remove('show'); bossWarn.style.animation='none'; }, Math.max(0, BOSS_WARN_TOTAL_DURATION)*1000 + 50);
	}
	export function updateSpawning(dt: number, state: GameState = GAME_STATE) {
		if (state.groupIndex >= GROUPS_PER_WAVE) return;
		
		if (state.groupMobIndex === 0 && state.groupIndex > 0 && state.groupIntervalTimer > 0) {
			state.groupIntervalTimer -= dt; return;
		}
		const isLastGroup = (state.groupIndex === GROUPS_PER_WAVE - 1);
		const groupSize = state.groupSizes[state.groupIndex] || 0;
		if (isLastGroup && (state.specialsQueued.mini || state.specialsQueued.boss) && !state.specialsSpawned) {
			if (state.specialsProgress === 0) {
				if (state.specialsQueued.boss) showBossWarning();
				if (state.specialsQueued.mini) {
					spawnSpecial(MINI_BOSS_A, state);
					state.specialsProgress = 1;
					if (state.specialsQueued.boss) { state.specialsTimer = BOSS_MINI_TO_BOSS_INTERVAL; return; }
					else { state.specialsSpawned = true; }
				}
				else {
					if (state.specialsQueued.boss) spawnSpecial(BOSS_A, state);
					state.specialsSpawned = true; state.specialsProgress = 2;
				}
			}
			else if (state.specialsProgress === 1 && state.specialsQueued.boss) {
				state.specialsTimer -= dt;
				if (state.specialsTimer <= 0) { spawnSpecial(BOSS_A, state); state.specialsSpawned = true; state.specialsProgress = 2; }
				else return;
			}
		}
		if (state.groupMobIndex < groupSize) {
			state.mobIntervalTimer -= dt;
			if (state.mobIntervalTimer <= 0) {
				spawnOneNormalMob(state);
				state.groupMobIndex += 1; state.toSpawn -= 1; state.mobIntervalTimer = state.mobIntervalWave;
			}
		}
		else {
			if (state.groupIndex < GROUPS_PER_WAVE - 1) {
				state.groupIndex += 1; state.groupMobIndex = 0; state.groupIntervalTimer = GROUP_INTERVAL_BASE; state.mobIntervalTimer = 0;
			}else { state.groupIndex = GROUPS_PER_WAVE; }
		}
	}

configureEntityHooks({ applyBarrageDamage, onMobKilled });
