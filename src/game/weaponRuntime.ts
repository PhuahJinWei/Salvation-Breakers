import { BULLET_RADIUS_SIZE, BULLET_SPEED, CRIT_MULT, CRIT_RATE } from './config';
import { GAME_STATE, getTypeBuff } from './state';
import {
	combineCooldownReductionPercent,
	computeWeaponDamage,
	cooldownMultiplierFromReductionPercent,
} from './combatMath';
import type { WeaponInstance } from './types';

export interface WeaponProjectileConfig {
	projectileCount: number;
	spreadRadians: number;
	hitRadius: number;
	pierceCount: number;
	splashRadius: number;
	splashFalloff: number;
	damageMultiplier: number;
	bulletSpeed: number;
	critRate: number;
}

export interface WeaponShotContext {
	weapon: WeaponInstance;
	dirX: number;
	dirY: number;
	projectileCount: number;
	spreadRadians: number;
	bulletSpeed: number;
	bulletRadius: number;
	pierceCount: number;
	splashRadius: number;
	splashFalloff: number;
	critRate: number;
	forceCrit: boolean;
	damageMultiplier: number;
}

export interface WeaponProjectile {
	weapon: WeaponInstance;
	gunKey: string;
	dx: number;
	dy: number;
	speed: number;
	damage: number;
	isCrit: boolean;
	radius: number;
	pierceCount: number;
	splashRadius: number;
	splashFalloff: number;
}

export interface WeaponHitContext {
	weapon: WeaponInstance;
	target: unknown;
	damage: number;
	isCrit: boolean;
	isSplash: boolean;
}

export interface WeaponModifier {
	beforeShot?: (context: WeaponShotContext) => void;
	onProjectileCreate?: (projectile: WeaponProjectile, context: WeaponShotContext) => void;
	afterShot?: (context: WeaponShotContext, projectiles: WeaponProjectile[]) => void;
	onHit?: (context: WeaponHitContext) => void;
}

interface WeaponTimingSnapshot {
	weapon: WeaponInstance;
	mode: WeaponInstance['mode'];
	timeBetweenBullets: number;
	postUseCooldown: number;
	lockoutTotal: number;
	lockoutElapsed: number;
	timer: number;
	burstLeft: number;
}

export function applyMultiplicativeCooldownReduction(type: string, cdrPct: number): void {
	const buff = getTypeBuff(type);
	buff.cdr_up = combineCooldownReductionPercent(buff.cdr_up || 0, cdrPct);
}

export function getCooldownMultiplier(weapon: WeaponInstance): number {
	return cooldownMultiplierFromReductionPercent(getTypeBuff(weapon.stats.type).cdr_up || 0);
}

export function effectiveTimeBetweenBullets(weapon: WeaponInstance): number {
	return Math.max(0, weapon.stats.timeBetweenBullets * getCooldownMultiplier(weapon));
}

export function effectivePostUseCooldown(weapon: WeaponInstance): number {
	return Math.max(0, weapon.stats.postUseCooldown * getCooldownMultiplier(weapon));
}

export function getWeaponLockoutTotal(weapon: WeaponInstance): number {
	const burstTime = Math.max(0, weapon.stats.bulletsPerUse - 1) * effectiveTimeBetweenBullets(weapon);
	return burstTime + effectivePostUseCooldown(weapon);
}

export function snapshotWeaponTimingsForType(type: string): WeaponTimingSnapshot[] {
	return (GAME_STATE.weapons || [])
		.filter((weapon) => weapon.stats.type === type)
		.map((weapon) => ({
			weapon,
			mode: weapon.mode,
			timeBetweenBullets: effectiveTimeBetweenBullets(weapon),
			postUseCooldown: effectivePostUseCooldown(weapon),
			lockoutTotal: weapon.lockoutTotal || 0,
			lockoutElapsed: weapon.lockoutElapsed || 0,
			timer: weapon.timer || 0,
			burstLeft: weapon.burstLeft || 0,
		}));
}

export function refreshWeaponTimingsFromSnapshots(snapshots: WeaponTimingSnapshot[]): void {
	for (const snapshot of snapshots) {
		const weapon = snapshot.weapon;
		if (weapon.mode !== snapshot.mode) continue;
		if (weapon.mode !== 'burst' && weapon.mode !== 'cooldown') continue;

		const newTimeBetween = effectiveTimeBetweenBullets(weapon);
		const newPostCooldown = effectivePostUseCooldown(weapon);
		const newLockoutTotal = getWeaponLockoutTotal(weapon);

		weapon.lockoutTotal = newLockoutTotal;

		if (weapon.mode === 'burst') {
			const timerRatio = snapshot.timeBetweenBullets > 0
				? Math.max(0, Math.min(1, snapshot.timer / snapshot.timeBetweenBullets))
				: 0;
			weapon.timer = timerRatio * newTimeBetween;

			const remainingBurstTime = Math.max(0, weapon.timer)
				+ Math.max(0, weapon.burstLeft - 1) * newTimeBetween;
			const remainingTotal = remainingBurstTime + newPostCooldown;
			weapon.lockoutElapsed = Math.max(0, Math.min(newLockoutTotal, newLockoutTotal - remainingTotal));
			continue;
		}

		const timerRatio = snapshot.postUseCooldown > 0
			? Math.max(0, Math.min(1, snapshot.timer / snapshot.postUseCooldown))
			: 0;
		weapon.timer = timerRatio * newPostCooldown;
		weapon.lockoutElapsed = Math.max(0, Math.min(newLockoutTotal, newLockoutTotal - weapon.timer));
	}
}

function getRuntimeState(weapon: WeaponInstance): Record<string, unknown> {
	if (!weapon.runtime) weapon.runtime = {};
	return weapon.runtime;
}

function getWeaponModifiers(weapon: WeaponInstance): WeaponModifier[] {
	const ability = weapon.stats.ability;
	if (!ability) return [];

	return String(ability)
		.split('|')
		.map((key) => WEAPON_MODIFIERS[key])
		.filter(Boolean);
}

function incrementRuntimeCounter(weapon: WeaponInstance, key: string): number {
	const runtime = getRuntimeState(weapon);
	const next = (Number(runtime[key]) || 0) + 1;
	runtime[key] = next;
	return next;
}

const WEAPON_MODIFIERS: Record<string, WeaponModifier> = {
	submachinegun_T3_GuaranteedCritAfter5: {
		beforeShot(context) {
			const shotCount = incrementRuntimeCounter(context.weapon, 'submachinegunGuaranteedCritShots');
			context.forceCrit = shotCount % 5 === 0;
		},
	},
};

function rotateVector(x: number, y: number, radians: number): { x: number; y: number } {
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	return {
		x: x * cos - y * sin,
		y: x * sin + y * cos,
	};
}

function computeDamage(weapon: WeaponInstance, isCrit: boolean, damageMultiplier: number): number {
	const typeDamagePct = getTypeBuff(weapon.stats.type).dmg_up || 0;
	return computeWeaponDamage(
		weapon.stats.damage,
		isCrit ? CRIT_MULT : 1,
		typeDamagePct,
		damageMultiplier,
	);
}

function getProjectileConfig(weapon: WeaponInstance): WeaponProjectileConfig {
	return {
		projectileCount: weapon.stats.projectileCount ?? 1,
		spreadRadians: weapon.stats.spreadRadians ?? 0,
		hitRadius: weapon.stats.hitRadius ?? BULLET_RADIUS_SIZE,
		pierceCount: weapon.stats.pierceCount ?? 1,
		splashRadius: weapon.stats.splashRadius ?? 0,
		splashFalloff: weapon.stats.splashFalloff ?? 0.5,
		damageMultiplier: weapon.stats.damageMultiplier ?? 1,
		bulletSpeed: BULLET_SPEED,
		critRate: CRIT_RATE + (weapon.stats.critRateBonus ?? 0),
	};
}

export function createWeaponProjectiles(weapon: WeaponInstance, dirX: number, dirY: number): WeaponProjectile[] {
	const config = getProjectileConfig(weapon);
	const context: WeaponShotContext = {
		weapon,
		dirX,
		dirY,
		projectileCount: config.projectileCount,
		spreadRadians: config.spreadRadians,
		bulletSpeed: config.bulletSpeed,
		bulletRadius: config.hitRadius,
		pierceCount: config.pierceCount,
		splashRadius: config.splashRadius,
		splashFalloff: config.splashFalloff,
		critRate: config.critRate,
		forceCrit: false,
		damageMultiplier: config.damageMultiplier,
	};

	const modifiers = getWeaponModifiers(weapon);
	for (const modifier of modifiers) {
		modifier.beforeShot?.(context);
	}

	const count = Math.max(1, Math.floor(context.projectileCount));
	const projectiles: WeaponProjectile[] = [];

	for (let i = 0; i < count; i++) {
		const offset = count === 1
			? (Math.random() - 0.5) * context.spreadRadians
			: (i - (count - 1) / 2) * context.spreadRadians;
		const direction = rotateVector(context.dirX, context.dirY, offset);
		const isCrit = context.forceCrit || (Math.random() < context.critRate);

		const projectile: WeaponProjectile = {
			weapon,
			gunKey: weapon.key,
			dx: direction.x,
			dy: direction.y,
			speed: context.bulletSpeed,
			damage: computeDamage(weapon, isCrit, context.damageMultiplier),
			isCrit,
			radius: context.bulletRadius,
			pierceCount: Math.max(1, Math.floor(context.pierceCount)),
			splashRadius: Math.max(0, context.splashRadius),
			splashFalloff: Math.max(0, Math.min(1, context.splashFalloff)),
		};

		for (const modifier of modifiers) {
			modifier.onProjectileCreate?.(projectile, context);
		}

		projectiles.push(projectile);
	}

	for (const modifier of modifiers) {
		modifier.afterShot?.(context, projectiles);
	}

	return projectiles;
}

export function notifyWeaponHit(context: WeaponHitContext): void {
	const modifiers = getWeaponModifiers(context.weapon);
	for (const modifier of modifiers) {
		modifier.onHit?.(context);
	}
}
