import { GAME_STATE, getTypeBuff } from './state';
import { applyMultiplicativeCooldownReduction } from './weaponRuntime';

export interface TraitDefinition {
	id: string;
	icon?: string;
	buff_type: 'dmg_up' | 'cdr_up' | 'unique';
	gun_type: string;
	name: (tier: number) => string;
	desc: (tier: number) => string;
	scaling: (tier: number) => number;
	apply: (tier: number) => void;
}

//Traits
	export const TRAIT_DMG_UP = [5,7,10];
	export const TRAIT_RELOAD_DOWN = [3,5,7];
	export const TRAIT_POINT_UP = [5,10,15];
	
	export const ROMAN = ['I','II','III'];
	export const TRAIT_BASE_CARD_COUNT = 3;
	export const TRAIT_EXTRA_CARD_CHANCE = 0.40;
	export const TRAITS: TraitDefinition[] = [
		{
			id: 'dmg_up_normal',
			buff_type: 'dmg_up',
			gun_type: 'normal',
			name: (tier) => 'Normal Attack Damage Increase ' + ROMAN[tier-1],
			desc: (_tier) => 'Increases normal attack damage by ',
			scaling: (tier) => TRAIT_DMG_UP[tier-1],
			apply: (tier)=>{
				getTypeBuff("normal").dmg_up += TRAIT_DMG_UP[tier-1];
			}
		},
		{
			id: 'dmg_up_aoe',
			buff_type: 'dmg_up',
			gun_type: 'aoe',
			name: (tier) => 'AoE Attack Damage Increase ' + ROMAN[tier-1],
			desc: (_tier) => 'Increases AoE attack damage by ',
			scaling: (tier) => TRAIT_DMG_UP[tier-1],
			apply: (tier)=>{
				getTypeBuff("aoe").dmg_up += TRAIT_DMG_UP[tier-1];
			}
		},
		{
			id: 'dmg_up_pierce',
			icon: 'dmg_up_all',
			buff_type: 'dmg_up',
			gun_type: 'pierce',
			name: (tier) => 'Pierce Attack Damage Increase ' + ROMAN[tier-1],
			desc: (_tier) => 'Increases Pierce attack damage by ',
			scaling: (tier) => TRAIT_DMG_UP[tier-1],
			apply: (tier)=>{
				getTypeBuff("pierce").dmg_up += TRAIT_DMG_UP[tier-1];
			}
		},
		{
			id: 'cdr_up_normal',
			buff_type: 'cdr_up',
			gun_type: 'normal',
			name: (tier) => 'Normal Attack Reload Time Decrease ' + ROMAN[tier-1],
			desc: (_tier) => 'Decrease Normal Attack Reload Time by ',
			scaling: (tier) => TRAIT_RELOAD_DOWN[tier-1],
			apply: (tier)=>{
				applyMultiplicativeCooldownReduction("normal", TRAIT_RELOAD_DOWN[tier-1]);
			}
		},
		{
			id: 'cdr_up_aoe',
			buff_type: 'cdr_up',
			gun_type: 'aoe',
			name: (tier) => 'AoE Attack Reload Time Decrease ' + ROMAN[tier-1],
			desc: (_tier) => 'Decrease AoE Attack Reload Time by ',
			scaling: (tier) => TRAIT_RELOAD_DOWN[tier-1],
			apply: (tier)=>{
				applyMultiplicativeCooldownReduction("aoe", TRAIT_RELOAD_DOWN[tier-1]);
			}
		},
		{
			id: 'cdr_up_pierce',
			icon: 'cdr_up_normal',
			buff_type: 'cdr_up',
			gun_type: 'pierce',
			name: (tier) => 'Pierce Attack Reload Time Decrease ' + ROMAN[tier-1],
			desc: (_tier) => 'Decrease Pierce Attack Reload Time by ',
			scaling: (tier) => TRAIT_RELOAD_DOWN[tier-1],
			apply: (tier)=>{
				applyMultiplicativeCooldownReduction("pierce", TRAIT_RELOAD_DOWN[tier-1]);
			}
		},
		{
			id: 'gold_up',
			buff_type: 'unique',
			gun_type: '',
			name: (tier) => 'Gold Gain Increase ' + ROMAN[tier-1],
			desc: (_tier) => 'Increases Goin gained from killing monsters by ',
			scaling: (tier) => TRAIT_POINT_UP[tier-1],
			apply: (tier)=>{
				GAME_STATE.buffs.unique.gold_up += TRAIT_POINT_UP[tier-1];
			}
		},
		{
			id: 'exp_up',
			buff_type: 'unique',
			gun_type: '',
			name: (tier) => 'EXP Gain Increase ' + ROMAN[tier-1],
			desc: (_tier) => 'Increases EXP gained from killing monsters by ',
			scaling: (tier) => TRAIT_POINT_UP[tier-1],
			apply: (tier)=>{
				GAME_STATE.buffs.unique.exp_up += TRAIT_POINT_UP[tier-1];
			}
		}
	];

//Pick Traits
	export function traitTierWeightsForLevel(level: number): [number, number, number] {
		// t is 0..1 (0 at level 1, 1 at level 21+)
		const t = Math.max(0, Math.min(1, (level-1)/20));
		const w1 = 0.70 * (1 - t) + 0.20 * t;   // 0.70  0.20
		const w3 = 0.05 * (1 - t) + 0.45 * t;   // 0.05  0.45
		const w2 = Math.max(0, 1 - w1 - w3);    // the rest
		return [w1, w2, w3];
	}
	export function pickTierForLevel(level: number): number {
		const [w1, w2] = traitTierWeightsForLevel(level);
		const r = Math.random();
		if (r < w1) return 1;
		if (r < w1 + w2) return 2;
		return 3;
	}
