import { BARRICADE_Y, CONTACT_DAMAGE_INTERVAL, BULLET_RADIUS_SIZE, W, H, DMG_NUM_LIFETIME, DMG_NUM_VY0, DMG_NUM_GRAVITY, DMG_NUM_POP_TIME } from './config';
import { GAME_STATE, addGunDamage } from './state';
import { clamp, roundRect, scaleHP } from './utils';
import { SFX_MOB_DEATH } from './audio';
import { notifyWeaponHit, type WeaponProjectile } from './weaponRuntime';
import { getEnemyAnimation, getEnemyProjectileHitbox, getEnemyVisualScale } from './enemySprites';
import type { BulletRuntime, DamageNumberRuntime, EnemyConfig, EnemyRuntime, GameState, WeaponInstance } from './types';

const entityHooks: {
	applyBarrageDamage: (dmg: number, state: GameState) => void;
	onMobKilled: (mob: Mob, state: GameState) => void;
} = { applyBarrageDamage: () => {}, onMobKilled: () => {} };

export function configureEntityHooks(hooks: Partial<typeof entityHooks>): void {
	Object.assign(entityHooks, hooks);
}

// ============ Class ============ //
	export class Mob implements EnemyRuntime
	{
		type: EnemyConfig;
		x: number;
		y: number;
		w: number;
		h: number;
		hpMax: number;
		hp: number;
		contact: boolean;
		contactTimer: number;
		dead: boolean;
		tookDamage: boolean;
		animTime: number;

		constructor(type: EnemyConfig, x: number, yStart: number) {
			this.type = type; this.x = x; this.y = yStart;
			this.w = type.size; this.h = type.size; 
			const __baseHp = type.hp;
			const __wave   = (GAME_STATE && GAME_STATE.wave) ? GAME_STATE.wave : 1;
			const __scaled = scaleHP(__baseHp, __wave);
			this.hpMax = __scaled;
			this.hp = __scaled;
			this.contact = false; this.contactTimer = 0; this.dead = false; this.tookDamage = false;
			this.animTime = Math.random() * 10;
		}
		get cx() { return this.x + this.w/2; }
		get cy() { return this.y + this.h/2; }
		
		update(dt: number, state: GameState = GAME_STATE): void {
			if (this.dead) return;
			this.animTime += dt;
			if (!this.contact) {
				this.y += this.type.speed * dt;
				if (this.y + this.h >= BARRICADE_Y) { this.y = BARRICADE_Y - this.h; this.contact = true; this.contactTimer = 0; }
			}
			else {
				this.contactTimer += dt;
				while (this.contactTimer >= CONTACT_DAMAGE_INTERVAL) { this.contactTimer -= CONTACT_DAMAGE_INTERVAL; entityHooks.applyBarrageDamage(this.type.dps, state); }
			}
		}
		hit(dmg: number, state: GameState = GAME_STATE): void {
			if (this.dead) return;
			this.hp -= dmg;
			if (this.type.tier) this.tookDamage = true;
			if (this.hp <= 0) { this.dead = true; SFX_MOB_DEATH(); entityHooks.onMobKilled(this, state); }
		}
		draw(ctx: CanvasRenderingContext2D): void {
			if (this.dead) return;
			ctx.save();
			const animation = getEnemyAnimation(this.type);
			if (animation.loaded) {
				const frame = animation.getFrame(this.animTime);
				const scale = getEnemyVisualScale(this.type);
				const drawH = this.h * scale;
				const drawW = drawH * (frame.sw / frame.sh);
				const drawX = this.cx - drawW / 2;
				const drawY = this.y + this.h - drawH;

				ctx.globalAlpha = this.type.tier ? 1 : 0.96;
				animation.draw(ctx, this.animTime, drawX, drawY, drawW, drawH);
			}
			else {
				if (this.type.tier === "boss") { ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#b91c1c'; }
				else if (this.type.tier === "mini") { ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#b45309'; }
				else { ctx.fillStyle = '#22d3ee'; ctx.strokeStyle = '#0ea5b7'; }
				ctx.lineWidth = 1.5;
				roundRect(ctx, this.x, this.y, this.w, this.h, 6);
				ctx.fill(); ctx.stroke();
			}

			if (this.type.tier && this.tookDamage) {
				const ratio = clamp(this.hp / this.hpMax, 0, 1);
				const barW = this.w, barH = 4;
				ctx.fillStyle = '#0f172a';
				ctx.fillRect(this.x, this.y - 6, barW, barH);
				ctx.fillStyle = '#fca5a5';
				ctx.fillRect(this.x, this.y - 6, barW * ratio, barH);
			}
			ctx.restore();
		}
	}
	export class Bullet implements BulletRuntime
	{
		x: number;
		y: number;
		vx: number;
		vy: number;
		r: number;
		dmg: number;
		crit: boolean;
		dead: boolean;
		gunKey: string | null;
		weapon: WeaponInstance | null;
		pierceLeft: number;
		splashRadius: number;
		splashFalloff: number;
		hitTargets: Set<EnemyRuntime>;

		constructor(
			x: number,
			y: number,
			dx: number,
			dy: number,
			speed: number,
			dmg: number,
			crit = false,
			projectile: WeaponProjectile | null = null,
		) {
			const len = Math.hypot(dx,dy) || 1;
			this.vx = dx/len * speed;
			this.vy = dy/len * speed;
			this.x = x;
			this.y = y;
			this.r = projectile?.radius ?? BULLET_RADIUS_SIZE;
			this.dmg = dmg;
			this.crit = crit;
			this.dead = false;
			this.gunKey = projectile?.gunKey ?? null;
			this.weapon = projectile?.weapon ?? null;
			this.pierceLeft = Math.max(1, projectile?.pierceCount ?? 1);
			this.splashRadius = Math.max(0, projectile?.splashRadius ?? 0);
			this.splashFalloff = Math.max(0, Math.min(1, projectile?.splashFalloff ?? 0.5));
			this.hitTargets = new Set();
		}
		update(dt: number, state: GameState = GAME_STATE): void {
			if (this.dead) return;
			this.x += this.vx * dt; this.y += this.vy * dt;
			if (this.x < -12 || this.x > W + 12 || this.y < -12 || this.y > H + 12) { this.dead = true; return; }
			for (const m of state.enemies) {
				if (m.dead) continue;
				if (this.hitTargets.has(m)) continue;
				const hitbox = getEnemyProjectileHitbox(m);
				const cx = Math.max(hitbox.x, Math.min(this.x, hitbox.x + hitbox.w));
				const cy = Math.max(hitbox.y, Math.min(this.y, hitbox.y + hitbox.h));
				const dx = this.x - cx, dy = this.y - cy;
				
				if (dx*dx + dy*dy <= this.r*this.r) {
					this.hitTargets.add(m);
					this.applyDamageToMob(state, m, this.dmg, this.crit, false, cx, m.y - 6);
					this.applySplashDamage(state, m);

					this.pierceLeft--;
					if (this.pierceLeft <= 0) {
						this.dead = true;
						break;
					}
				}
			}
		}
		applyDamageToMob(
			state: GameState,
			m: EnemyRuntime,
			dmg: number,
			crit: boolean,
			isSplash: boolean,
			showX: number,
			showY: number,
		): number {
			if (!m || m.dead || dmg <= 0) return 0;

			const hpBefore = m.hp;
			const dealt = Math.min(dmg, hpBefore);
			if (dealt <= 0) return 0;

			m.hit(dealt, state);
			addGunDamage(this.gunKey, dealt, state);
			(state.dmgNums || (state.dmgNums = [])).push(new DmgNum(showX, showY, dealt, crit));

			if (this.weapon) {
				notifyWeaponHit({
					weapon: this.weapon,
					target: m,
					damage: dealt,
					isCrit: crit,
					isSplash,
				});
			}

			return dealt;
		}
		applySplashDamage(state: GameState, primaryTarget: EnemyRuntime): void {
			if (this.splashRadius <= 0) return;

			const radiusSq = this.splashRadius * this.splashRadius;
			for (const m of state.enemies) {
				if (m.dead || m === primaryTarget) continue;
				if (this.hitTargets.has(m)) continue;
				const dx = m.cx - primaryTarget.cx;
				const dy = m.cy - primaryTarget.cy;
				const distSq = dx * dx + dy * dy;
				if (distSq > radiusSq) continue;

				const dist = Math.sqrt(distSq);
				const t = clamp(dist / this.splashRadius, 0, 1);
				const multiplier = 1 - (1 - this.splashFalloff) * t;
				const splashDamage = this.dmg * multiplier;
				this.applyDamageToMob(state, m, splashDamage, this.crit, true, m.cx, m.y - 6);
			}
		}
		draw(ctx: CanvasRenderingContext2D): void {
			if (this.dead) return;
			ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
			ctx.fillStyle = this.crit ? '#fb7185' : '#fbbf24'; ctx.fill();
			ctx.shadowColor = this.crit ? '#fecdd3' : '#fde68a'; ctx.shadowBlur = 10; ctx.restore();
		}
	}
	export class DmgNum implements DamageNumberRuntime
	{
		x: number;
		y: number;
		val: number;
		crit: boolean;
		age: number;
		life: number;
		vx: number;
		vy: number;

		constructor(x: number, y: number, val: number, crit = false) {
			this.x = x + (Math.random()*8 - 4);
			this.y = y;
			this.val  = Math.round(val);
			this.crit = crit;
			
			this.age  = 0;
			this.life = DMG_NUM_LIFETIME;
			
			// jump physics
			this.vx = (Math.random() * 20 - 10);
			this.vy = DMG_NUM_VY0;
		}
		update(dt: number): void {
			this.age += dt;
			this.vy  += DMG_NUM_GRAVITY * dt;
			this.x   += this.vx * dt;
			this.y   += this.vy * dt;
		}
		draw(ctx: CanvasRenderingContext2D): void {
			const a = Math.max(0, 1 - this.age / this.life);
			let s = 1;
			if (this.age < DMG_NUM_POP_TIME) {
				const t = 1 - (this.age / DMG_NUM_POP_TIME); //dmg poptime
				s = 1 + 0.25 * t;
			}
			ctx.save();
			ctx.globalAlpha = a;
			ctx.translate(this.x, this.y);
			ctx.scale(s, s);
			ctx.font = this.crit ? '600 25px "Rajdhani", sans-serif' : '600 22px "Rajdhani", sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'rgba(0,0,0,0.6)';
			ctx.fillStyle   = this.crit ? '#f59e0b' : '#FFFFFA'; // orange crit, white normal
			ctx.strokeText(String(this.val), 0, 0);
			ctx.fillText(String(this.val), 0, 0);
			ctx.restore();
		}
	}
