export type WeaponKey = string;
export type GunType = string;

export interface PlayerState {
	x: number;
	y: number;
	size: number;
	level: number;
	exp: number;
	expToNext: number;
	aimVX?: number;
	aimVY?: number;
}

export interface TypeBuffState {
	dmg_up: number;
	cdr_up: number;
}

export interface UniqueBuffState {
	gold_up: number;
	exp_up: number;
}

export interface BuffState {
	unique: UniqueBuffState;
	[type: string]: TypeBuffState | UniqueBuffState;
}

export interface WeaponStats {
	bulletsPerUse: number;
	timeBetweenBullets: number;
	damage: number;
	postUseCooldown: number;
	ability: string;
	range: number;
	type: GunType;
	projectileCount?: number;
	spreadRadians?: number;
	hitRadius?: number;
	pierceCount?: number;
	splashRadius?: number;
	splashFalloff?: number;
	damageMultiplier?: number;
	critRateBonus?: number;
}

export interface WeaponTierConfig {
	bulletsPerUse: number;
	timeBetweenBullets: number;
	damage: number;
	postUseCooldown: number;
	ability: string;
	projectileCount?: number;
	spreadRadians?: number;
	hitRadius?: number;
	pierceCount?: number;
	splashRadius?: number;
	splashFalloff?: number;
	damageMultiplier?: number;
	critRateBonus?: number;
}

export interface WeaponConfig {
	name: string;
	type: GunType;
	range: number;
	shape: Array<[number, number]>;
	tiers: Record<number, WeaponTierConfig>;
}

export interface EnemyConfig {
	name: string;
	hp: number;
	exp: number;
	speed: number;
	dps: number;
	size: number;
	coin: number;
	score: number;
	spriteKey?: string;
	tier?: 'mini' | 'boss' | string;
}

export interface WeaponInstance {
	key: WeaponKey;
	tier: number;
	stats: WeaponStats;
	mode: 'idle' | 'burst' | 'cooldown';
	timer: number;
	burstLeft: number;
	lockoutTotal?: number;
	lockoutElapsed?: number;
	dirX?: number;
	dirY?: number;
	runtime?: Record<string, unknown>;
}

export interface InventoryItem {
	key: WeaponKey;
	tier: number;
}

export interface EnemyRuntime {
	type: EnemyConfig;
	x: number;
	y: number;
	w: number;
	h: number;
	hp: number;
	hpMax: number;
	dead: boolean;
	tookDamage?: boolean;
	cx: number;
	cy: number;
	hit(dmg: number, state?: GameState): void;
	update(dt: number, state?: GameState): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

export interface BulletRuntime {
	dead: boolean;
	update(dt: number, state?: GameState): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

export interface DamageNumberRuntime {
	x: number;
	y: number;
	val: number;
	crit: boolean;
	age: number;
	life: number;
	update(dt: number): void;
	draw(ctx: CanvasRenderingContext2D): void;
}

export interface ShopRuntimeState {
	reroll_count: number;
	reroll_price: number;
	removal_count: number;
	removal_set: Set<WeaponKey>;
}

export interface GameState {
	paused: boolean;
	coins: number;
	score: number;
	kills: number;
	speedMult: number;
	player: PlayerState;
	barricadeHP: number;
	buffs: BuffState;
	enemies: EnemyRuntime[];
	bullets: BulletRuntime[];
	dmgNums?: DamageNumberRuntime[];
	traitsOwned: Array<{ id: string; name?: unknown; tier: number }>;
	inventory: Array<InventoryItem | null>;
	weapons?: WeaponInstance[];
	wave: number;
	toSpawn: number;
	groupIndex: number;
	groupSizes: number[];
	groupMobIndex: number;
	groupIntervalTimer: number;
	mobIntervalTimer: number;
	mobIntervalWave: number;
	specialsQueued: { mini: boolean; boss: boolean };
	specialsSpawned: boolean;
	specialsProgress: number;
	specialsTimer: number;
	shop: ShopRuntimeState;
	damageByGun: Record<string, number>;
	combatTime: number;
}
