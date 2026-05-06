import { BARRICADE_HP_MAX, GUN_CONFIG, H, W } from './config';
import type { BuffState, GameState, TypeBuffState, WeaponInstance } from './types';

export function createInitialBuffs(): BuffState {
	const buffs: BuffState = {
		unique: {
			gold_up: 0,
			exp_up: 0,
		},
	};

	const types = new Set<string>(
		Object.values(GUN_CONFIG).map((gun) => String(gun.type)),
	);

	for (const type of types) {
		buffs[type] = {
			dmg_up: 0,
			cdr_up: 0,
		};
	}

	return buffs;
}

export function getTypeBuff(type: string): TypeBuffState {
	const buff = GAME_STATE.buffs[type] as TypeBuffState | undefined;

	if (!buff || typeof buff.dmg_up !== 'number' || typeof buff.cdr_up !== 'number') {
		const fresh = { dmg_up: 0, cdr_up: 0 };
		GAME_STATE.buffs[type] = fresh;
		return fresh;
	}

	return buff;
}

export function createInitialGameState(): GameState {
	return {
		paused: false,
		coins: 0,
		score: 0,
		kills: 0,
		speedMult: 1,
		player: {
			x: W / 2,
			y: H - 40,
			size: 16,
			level: 1,
			exp: 0,
			expToNext: 50,
		},
		barricadeHP: BARRICADE_HP_MAX,
		buffs: createInitialBuffs(),
		enemies: [],
		bullets: [],
		dmgNums: [],
		traitsOwned: [],
		inventory: new Array(16).fill(null),
		wave: 1,
		toSpawn: 0,
		groupIndex: 0,
		groupSizes: [],
		groupMobIndex: 0,
		groupIntervalTimer: 0,
		mobIntervalTimer: 0,
		mobIntervalWave: 0,
		specialsQueued: { mini: false, boss: false },
		specialsSpawned: false,
		specialsProgress: 0,
		specialsTimer: 0,
		shop: {
			reroll_count: 10,
			reroll_price: 1000,
			removal_count: 5,
			removal_set: new Set(),
		},
		damageByGun: {},
		combatTime: 0,
	};
}

export function makeWeaponInstance(key: string, tier: number): WeaponInstance {
	const gunStats = GUN_CONFIG[key];

	if (!gunStats || !gunStats.tiers?.[tier]) {
		throw new Error(`Unknown weapon/tier: ${key} T${tier}`);
	}

	const tierStats = gunStats.tiers[tier];

	return {
		key,
		tier,
		stats: {
			...tierStats,
			range: gunStats.range,
			type: gunStats.type,
		},
		mode: 'idle',
		timer: 0,
		burstLeft: 0,
		runtime: {},
	};
}

export let GAME_STATE: GameState = createInitialGameState();

export function resetGameState(): GameState {
	GAME_STATE = createInitialGameState();
	return GAME_STATE;
}

export function addGunDamage(gunKey: string | null | undefined, dmg: number, state: GameState = GAME_STATE): void {
	if (!gunKey || !dmg) return;

	state.damageByGun[gunKey] = (state.damageByGun[gunKey] || 0) + dmg;
}
