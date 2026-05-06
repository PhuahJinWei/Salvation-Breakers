import assert from 'node:assert/strict';
import test from 'node:test';
import { importGameModule } from './helpers/importTsModule.mjs';

const placement = await importGameModule('shopPlacement');
const merge = await importGameModule('shopMerge');
const shopStateModule = await importGameModule('shopState');
const shopConfig = await importGameModule('shopConfig');
const dragRules = await importGameModule('shopDragRules');

function item(overrides = {}) {
	return {
		id: overrides.id || 'item',
		key: overrides.key || 'submachinegun',
		tier: overrides.tier || 1,
		color: undefined,
		r: overrides.r ?? null,
		c: overrides.c ?? null,
	};
}

test('shop placement clamps weapon shapes inside the grid', () => {
	const sniper = item({ key: 'sniperriffle' });

	assert.deepEqual(placement.clampPlacementToGrid(sniper, -5, -3), { r: 0, c: 0 });
	assert.deepEqual(placement.clampPlacementToGrid(sniper, 99, 99), { r: 5, c: 7 });
});

test('shop merge rules only merge matching key and tier below tier 4', () => {
	assert.equal(merge.canMergeItems(item({ key: 'pistol', tier: 2 }), item({ key: 'pistol', tier: 2 })), true);
	assert.equal(merge.canMergeItems(item({ key: 'pistol', tier: 2 }), item({ key: 'submachinegun', tier: 2 })), false);
	assert.equal(merge.canMergeItems(item({ key: 'pistol', tier: 4 }), item({ key: 'pistol', tier: 4 })), false);
});

test('grid drop merges matching overlap and removes source item', () => {
	const target = item({ id: 'target', key: 'pistol', tier: 1, r: 0, c: 0 });
	const source = item({ id: 'source', key: 'pistol', tier: 1 });
	shopStateModule.shopState.items = [target, source];

	const result = merge.resolveDropOnGrid(source, 0, 0);

	assert.deepEqual(result, { merged: true });
	assert.equal(target.tier, 2);
	assert.deepEqual(shopStateModule.shopState.items.map((it) => it.id), ['target']);
});

test('drag snap uses grab offset inside the grid', () => {
	const grid = fakeGrid();
	const pointerX = 100 + shopConfig.cellStep * 3 + 4;
	const pointerY = 200 + shopConfig.cellStep * 2 + 4;
	const snap = placement.snapToGrid(pointerX, pointerY, 4, 4, grid);

	assert.deepEqual(snap, { r: 2, c: 3 });
});

test('grid magnet zone includes near-edge points and excludes outside points', () => {
	const grid = fakeGrid();
	const insideNearLeft = 100 - shopConfig.GRID_MAGNET_MARGIN + 1;
	const outsideLeft = 100 - shopConfig.GRID_MAGNET_MARGIN - 1;

	assert.equal(placement.isInGridMagnetZone(insideNearLeft, 220, grid), true);
	assert.equal(placement.isInGridMagnetZone(outsideLeft, 220, grid), false);
});

test('preview should hide outside the magnet zone', () => {
	const grid = fakeGrid();
	const outsideX = 100 + grid.getBoundingClientRect().width + shopConfig.GRID_MAGNET_MARGIN + 1;

	assert.equal(placement.isInGridMagnetZone(outsideX, 220, grid), false);
});

test('dropping the last placed gun into offer returns it to its grid slot', () => {
	const dragged = item({ r: 2, c: 3 });
	const result = dragRules.applyOfferDropFallback(
		dragged,
		{ r: 2, c: 3 },
		{ dragFrom: 'grid', offerCountWithoutItem: 2, placedCount: 1 },
	);

	assert.equal(result, 'returned-to-grid');
	assert.equal(dragged.r, 2);
	assert.equal(dragged.c, 3);
});

test('last placed gun is prevented from moving to the offer area', () => {
	assert.equal(dragRules.shouldReturnDraggedGridItemToStart({
		dragFrom: 'grid',
		offerCountWithoutItem: 0,
		placedCount: 1,
	}), true);
});

function fakeGrid() {
	const width = shopConfig.GRID_COLS * shopConfig.cellStep - shopConfig.CELL_GAP;
	const height = shopConfig.GRID_ROWS * shopConfig.cellStep - shopConfig.CELL_GAP;
	return {
		getBoundingClientRect() {
			return {
				left: 100,
				top: 200,
				right: 100 + width,
				bottom: 200 + height,
				width,
				height,
			};
		},
	};
}
