import { SpriteSheetAnimation } from './spriteAnimation';
import { publicAssetPath } from './assets';
import type { EnemyConfig, EnemyRuntime } from './types';

export interface EnemySpriteConfig {
	src: string;
	frameCount: number;
	fps: number;
	visualScale: {
		normal: number;
		mini: number;
		boss: number;
	};
	projectileHitboxScale: number;
}

const DEFAULT_SPRITE_KEY = 'mob_type_a';

export const ENEMY_SPRITES: Record<string, EnemySpriteConfig> = {
	mob_type_a: {
		src: publicAssetPath('/img/entity/mob_typeA_spritesheet.png'),
		frameCount: 8,
		fps: 8,
		visualScale: {
			normal: 2.00,
			mini: 2.50,
			boss: 2.50,
		},
		projectileHitboxScale: 1.25,
	},
};

const animationCache = new Map<string, SpriteSheetAnimation>();

export function getEnemySpriteConfig(type: EnemyConfig): EnemySpriteConfig {
	return ENEMY_SPRITES[type.spriteKey || DEFAULT_SPRITE_KEY] || ENEMY_SPRITES[DEFAULT_SPRITE_KEY];
}

export function getEnemyAnimation(type: EnemyConfig): SpriteSheetAnimation {
	const config = getEnemySpriteConfig(type);
	const cacheKey = type.spriteKey || DEFAULT_SPRITE_KEY;
	let animation = animationCache.get(cacheKey);

	if (!animation) {
		animation = new SpriteSheetAnimation({
			src: config.src,
			frameCount: config.frameCount,
			fps: config.fps,
		});
		animationCache.set(cacheKey, animation);
	}

	return animation;
}

export function getEnemyVisualScale(type: EnemyConfig): number {
	const config = getEnemySpriteConfig(type);
	if (type.tier === 'boss') return config.visualScale.boss;
	if (type.tier === 'mini') return config.visualScale.mini;
	return config.visualScale.normal;
}

export function getEnemyProjectileHitbox(enemy: EnemyRuntime): { x: number; y: number; w: number; h: number } {
	const scale = getEnemySpriteConfig(enemy.type).projectileHitboxScale;
	const w = enemy.w * scale;
	const h = enemy.h * scale;

	return {
		x: enemy.cx - w / 2,
		y: enemy.cy - h / 2,
		w,
		h,
	};
}
