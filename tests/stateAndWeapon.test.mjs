import assert from 'node:assert/strict';
import test from 'node:test';
import { importGameModule } from './helpers/importTsModule.mjs';

const stateModule = await importGameModule('state');
const weaponRuntime = await importGameModule('weaponRuntime');
const utils = await importGameModule('utils');

test('resetGameState creates fresh nested runtime objects', () => {
	const first = stateModule.resetGameState();
	first.shop.removal_set.add('pistol');
	first.inventory[0] = { key: 'pistol', tier: 1 };
	first.buffs.normal.dmg_up = 99;

	const second = stateModule.resetGameState();

	assert.notEqual(first, second);
	assert.equal(second.shop.removal_set.size, 0);
	assert.equal(second.inventory[0], null);
	assert.equal(second.buffs.normal.dmg_up, 0);
});

test('weapon projectile creation uses configured pierce and splash behavior', () => {
	const sniper = stateModule.makeWeaponInstance('sniperriffle', 1);
	const grenade = stateModule.makeWeaponInstance('grenadelauncher', 1);

	const sniperProjectile = weaponRuntime.createWeaponProjectiles(sniper, 0, -1)[0];
	const grenadeProjectile = weaponRuntime.createWeaponProjectiles(grenade, 0, -1)[0];

	assert.equal(sniperProjectile.pierceCount, 3);
	assert.equal(grenadeProjectile.splashRadius, 64);
});

test('cooldown timing updates after multiplicative trait change', () => {
	const gameState = stateModule.resetGameState();
	const weapon = stateModule.makeWeaponInstance('submachinegun', 1);
	gameState.weapons = [weapon];

	const before = weaponRuntime.effectivePostUseCooldown(weapon);
	weaponRuntime.applyMultiplicativeCooldownReduction('normal', 20);
	const after = weaponRuntime.effectivePostUseCooldown(weapon);

	assert.equal(Number((after / before).toFixed(2)), 0.8);
});

test('wave grouping preserves total count across groups', () => {
	const groups = utils.splitIntoGroups(23, 5);

	assert.equal(groups.length, 5);
	assert.equal(groups.reduce((sum, value) => sum + value, 0), 23);
	assert.equal(groups.every((value) => value >= 1), true);
});
