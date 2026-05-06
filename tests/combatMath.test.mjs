import assert from 'node:assert/strict';
import test from 'node:test';
import { importGameModule } from './helpers/importTsModule.mjs';

const math = await importGameModule('combatMath');

test('cooldown reductions stack multiplicatively', () => {
	const first = math.combineCooldownReductionPercent(0, 20);
	const combined = math.combineCooldownReductionPercent(first, 20);

	assert.equal(Number(combined.toFixed(2)), 36);
	assert.equal(Number(math.cooldownMultiplierFromReductionPercent(combined).toFixed(2)), 0.64);
});

test('cooldown reduction is clamped to leave 5 percent timing', () => {
	const combined = math.combineCooldownReductionPercent(90, 90);

	assert.equal(combined, 95);
	assert.equal(Number(math.cooldownMultiplierFromReductionPercent(combined).toFixed(2)), 0.05);
});

test('weapon damage combines crit, type buff, and weapon modifier', () => {
	const damage = math.computeWeaponDamage(100, 2, 25, 0.8);

	assert.equal(damage, 200);
});
