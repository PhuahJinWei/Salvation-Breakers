export const MAX_CDR_PERCENT = 95;
export const MIN_COOLDOWN_MULTIPLIER = 1 - MAX_CDR_PERCENT / 100;

export function clampCooldownReductionPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(MAX_CDR_PERCENT, value));
}

export function cooldownMultiplierFromReductionPercent(cdrPct: number): number {
	return Math.max(
		MIN_COOLDOWN_MULTIPLIER,
		1 - clampCooldownReductionPercent(cdrPct) / 100,
	);
}

export function combineCooldownReductionPercent(currentPct: number, addedPct: number): number {
	const currentMultiplier = cooldownMultiplierFromReductionPercent(currentPct);
	const addedMultiplier = cooldownMultiplierFromReductionPercent(addedPct);
	const combinedMultiplier = Math.max(
		MIN_COOLDOWN_MULTIPLIER,
		currentMultiplier * addedMultiplier,
	);

	return clampCooldownReductionPercent((1 - combinedMultiplier) * 100);
}

export function computeWeaponDamage(
	baseDamage: number,
	critMultiplier: number,
	typeDamageBuffPct: number,
	weaponDamageModifier: number,
): number {
	return baseDamage
		* critMultiplier
		* (1 + typeDamageBuffPct / 100)
		* weaponDamageModifier;
}
