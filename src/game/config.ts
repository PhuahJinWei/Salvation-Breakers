import type { EnemyConfig, WeaponConfig, WeaponKey } from './types';

// ==================== Config ==================== //
	
	//game frame
	export const FRAME_W  = 600, FRAME_H  = 1065;
	export const CANVAS_W = FRAME_W, CANVAS_H = 750;
	
	//game canvas
	export const W = CANVAS_W, H = CANVAS_H;
	export const BARRICADE_Y = H - 155;
	export const BARRICADE_HP_MAX = 500;
	
	//Game Speed
	export const SPEED_STORAGE_KEY = 'rlg_speed_v1';
	
	//Wave-based
	export const CURRENT_WAVE = 10;
	export const WAVE_1_COUNT = 8;
	export const WAVE_INCREASE = 1.01;
	export const GROUPS_PER_WAVE = 5;
	export const GROUP_INTERVAL_BASE = 20.0;
	export const MOB_INTERVAL_BASE = 0.50;
	export const MOB_INTERVAL_MIN  = 0.30;
	export const MOB_INTERVAL_DECAY_PER_WAVE = 0.3;
	export const CONTACT_DAMAGE_INTERVAL = 3.0;
	export const MOB_HP_PER_WAVE = 0.04;
	
	// Banner + spacing config
	export const BOSS_WARN_FLASHES = 2;
	export const BOSS_WARN_TOTAL_DURATION = 2;
	export const BOSS_MINI_TO_BOSS_INTERVAL = 0.2;
	
	//DPS number
	export const DMG_NUM_LIFETIME = 2.0;   // seconds total (auto-remove after this)
	export const DMG_NUM_VY0      = -3;  // initial upward jump (px/s)
	export const DMG_NUM_GRAVITY  = 2.5;   // pulls the number back down (px/s^2)
	export const DMG_NUM_POP_TIME = 1.0;  // quick pop scale duration on spawn (s)
	
	//Mobs
	export const MOBS: Record<string, EnemyConfig> = {
		"A": {name:"Mob A", hp: 80, exp: 10, speed: 20, dps: 20, size: 45, coin: 130, score: 140, spriteKey: "mob_type_a" },
		"B": {name:"Mob B", hp: 80, exp: 10, speed: 20, dps: 20, size: 45, coin: 130, score: 140, spriteKey: "mob_type_a" }
	};
	export const MINI_BOSS_A: EnemyConfig = { name: "Mini-boss Type A", hp: 1000, exp: 100, speed: 15, dps: 30, size: 70, coin: 500, score: 500, tier: "mini", spriteKey: "mob_type_a" };
	export const BOSS_A: EnemyConfig = { name: "Boss Type A", hp: 2000, exp: 1000, speed: 10, dps: 50, size: 100, coin: 1000, score: 1000, tier: "boss", spriteKey: "mob_type_a" };
	
	//Weapons
	export const CRIT_RATE = 0.15;
	export const CRIT_MULT = 1.5;
	export const BULLET_RADIUS_SIZE = 8;
	export const BULLET_SPEED = 350;
	export const GUN_MULTITARGET_PROBILITY = 0.6; //chance of focusing on nearest, ++ to allow more multi-targetting
	
	export const GUN_CONFIG: Record<WeaponKey, WeaponConfig> = {
		submachinegun: {
			name: "Submachine Gun",
			type: "normal",
			range: 460,
			shape: [[0,0],[0,1],[0,2],[1,0]],
			tiers: {
				1: { bulletsPerUse: 5, timeBetweenBullets: 0.13, damage: 24, postUseCooldown: 1.2, ability: "", hitRadius: 7, spreadRadians: 0.06 },
				2: { bulletsPerUse: 6, timeBetweenBullets: 0.12, damage: 31, postUseCooldown: 1.35, ability: "", hitRadius: 7, spreadRadians: 0.06 },
				3: { bulletsPerUse: 8, timeBetweenBullets: 0.11, damage: 44, postUseCooldown: 1.55, ability: "submachinegun_T3_GuaranteedCritAfter5", hitRadius: 7, spreadRadians: 0.06 },
				4: { bulletsPerUse: 9, timeBetweenBullets: 0.10, damage: 58, postUseCooldown: 1.65, ability: "submachinegun_T3_GuaranteedCritAfter5", hitRadius: 7, spreadRadians: 0.06 }
			}
		},
		pistol: {
			name: "Pistol",
			type: "normal",
			range: 400,
			shape: [[0,0],[0,1],[1,0]],
			tiers: {
				1: { bulletsPerUse: 2, timeBetweenBullets: 0.18, damage: 45, postUseCooldown: 2.4, ability: "", hitRadius: 8, critRateBonus: 0.10 },
				2: { bulletsPerUse: 2, timeBetweenBullets: 0.18, damage: 62, postUseCooldown: 2.6, ability: "", hitRadius: 8, critRateBonus: 0.12 },
				3: { bulletsPerUse: 3, timeBetweenBullets: 0.16, damage: 82, postUseCooldown: 2.8, ability: "", hitRadius: 8, critRateBonus: 0.15 },
				4: { bulletsPerUse: 3, timeBetweenBullets: 0.15, damage: 108, postUseCooldown: 3.0, ability: "", hitRadius: 8, critRateBonus: 0.18 },
			}
		},
		sniperriffle: {
			name: "Sniper Riffle",
			type: "pierce",
			range: 650,
			shape: [[0,0],[1,0],[2,0],[3,0],[3,1]],
			tiers: {
				1: { bulletsPerUse: 1, timeBetweenBullets: 0, damage: 145, postUseCooldown: 4.4, ability: "", hitRadius: 10, pierceCount: 3 },
				2: { bulletsPerUse: 1, timeBetweenBullets: 0, damage: 190, postUseCooldown: 5.1, ability: "", hitRadius: 10, pierceCount: 3 },
				3: { bulletsPerUse: 1, timeBetweenBullets: 0, damage: 245, postUseCooldown: 5.8, ability: "", hitRadius: 11, pierceCount: 3 },
				4: { bulletsPerUse: 1, timeBetweenBullets: 0, damage: 310, postUseCooldown: 6.4, ability: "", hitRadius: 12, pierceCount: 3 },
			}
		},
		assaultriffle: {
			name: "Assault Riffle",
			type: "normal",
			range: 460,
			shape: [[0,0],[0,1],[1,1],[0,2],[0,3]],
			tiers: {
				1: { bulletsPerUse: 4, timeBetweenBullets: 0.16, damage: 34, postUseCooldown: 1.45, ability: "", hitRadius: 8, projectileCount: 1, spreadRadians: 0.035 },
				2: { bulletsPerUse: 5, timeBetweenBullets: 0.15, damage: 43, postUseCooldown: 1.75, ability: "", hitRadius: 8, projectileCount: 1, spreadRadians: 0.035 },
				3: { bulletsPerUse: 6, timeBetweenBullets: 0.14, damage: 59, postUseCooldown: 2.05, ability: "", hitRadius: 8, projectileCount: 1, spreadRadians: 0.035 },
				4: { bulletsPerUse: 7, timeBetweenBullets: 0.13, damage: 75, postUseCooldown: 2.3, ability: "", hitRadius: 8, projectileCount: 1, spreadRadians: 0.035 },
			}
		},
		grenadelauncher: {
			name: "Granade Launcher",
			type: "aoe",
			range: 460,
			shape: [[1,0],[1,1],[0,1],[0,2]],
			tiers: {
				1: { bulletsPerUse: 1, timeBetweenBullets: 0, damage: 58, postUseCooldown: 2.8, ability: "", hitRadius: 11, splashRadius: 64, splashFalloff: 0.55 },
				2: { bulletsPerUse: 1, timeBetweenBullets: 0, damage: 78, postUseCooldown: 3.2, ability: "", hitRadius: 11, splashRadius: 72, splashFalloff: 0.55 },
				3: { bulletsPerUse: 2, timeBetweenBullets: 0.28, damage: 92, postUseCooldown: 3.8, ability: "", hitRadius: 12, splashRadius: 80, splashFalloff: 0.5 },
				4: { bulletsPerUse: 2, timeBetweenBullets: 0.24, damage: 118, postUseCooldown: 4.2, ability: "", hitRadius: 12, splashRadius: 88, splashFalloff: 0.5 },
			}
		}
	};
