import { GUN_CONFIG } from './config';
import { CELL, CELL_GAP } from './shopConfig';
import type { ShapeBounds } from './shopTypes';

type ShapeCoord = [number, number];

interface OutlineOptions {
	cellStepX: number;
	cellStepY: number;
	cellSize: number;
	borderPx: number;
	offX: number;
	offY: number;
}

interface OutlineSegment {
	x: number;
	y: number;
	w: number;
	h: number;
}

export function getShapeBounds(key: string): ShapeBounds {
	const shape = GUN_CONFIG[key].shape || [];
	let maxDR = 0;
	let maxDC = 0;
	for (const [dr, dc] of shape) {
		if (dr > maxDR) maxDR = dr;
		if (dc > maxDC) maxDC = dc;
	}
	return {
		cellCols: maxDC + 1,
		cellRows: maxDR + 1,
	};
}

export function updateShopOfferLayout(targetEl: HTMLElement, count: number): void {
	const cols = count > 5 ? 5 : Math.min(Math.max(count || 1, 1), 5);
	const rows = count > 5 ? 2 : 1;

	targetEl.style.setProperty('--shop-gun-offer-count', String(cols));
	targetEl.style.setProperty('--shop-gun-offer-rows', String(rows));
}

export function getShopOfferItemScale(count: number, targetEl: HTMLElement | null = null): number {
	const isRemovedList = targetEl?.classList?.contains('weapon-removal-removed-list');

	if (isRemovedList) {
		if (count >= 5) return 0.46;
		if (count === 4) return 0.62;
		return 1;
	}

	if (count > 5) return 0.58;
	if (count === 5) return 0.58;
	if (count === 4) return 0.8;
	return 1;
}

export function createGunShapeElement(
	key: string,
	tier: number,
	cellSize: number,
	className: string,
): HTMLDivElement {
	const chip = document.createElement('div');
	chip.className = className;

	const { cellCols, cellRows } = getShapeBounds(key);
	const chipWidth = cellCols * cellSize;
	const chipHeight = cellRows * cellSize;

	chip.style.width = chipWidth + 'px';
	chip.style.height = chipHeight + 'px';

	for (const [dr, dc] of GUN_CONFIG[key].shape) {
		const d = document.createElement('div');
		d.className = 'mini-cell';
		d.style.position = 'absolute';

		d.style.left = (dc * cellSize) + 'px';
		d.style.top = (dr * cellSize) + 'px';
		d.style.width = cellSize + 'px';
		d.style.height = cellSize + 'px';

		d.style.backgroundImage = "url('/img/UI_shop_slot_background_tier_" + tier + ".png')";
		d.style.backgroundSize = '100% 100%';
		d.style.backgroundRepeat = 'no-repeat';
		d.style.backgroundPosition = 'center';
		chip.appendChild(d);
	}

	const spriteMini = document.createElement('img');
	spriteMini.className = 'gun-sprite-mini';
	spriteMini.src = '/img/item/shop/gun_shop_' + key + '.png';
	spriteMini.style.position = 'absolute';
	spriteMini.style.left = '0px';
	spriteMini.style.top = '0px';
	spriteMini.style.width = chipWidth + 'px';
	spriteMini.style.height = chipHeight + 'px';
	spriteMini.style.objectFit = 'contain';
	spriteMini.style.pointerEvents = 'none';
	chip.appendChild(spriteMini);

	appendOutlineBorderMini(chip, GUN_CONFIG[key].shape, cellSize);
	return chip;
}

function buildOutlineSegments(coords: ShapeCoord[], {
	cellStepX,
	cellStepY,
	cellSize,
	borderPx,
	offX,
	offY,
}: OutlineOptions): OutlineSegment[] {
	const occ = new Set(coords.map(([r, c]) => r + ',' + c));
	const topEdges = new Map<number, number[]>();
	const bottomEdges = new Map<number, number[]>();
	const leftEdges = new Map<number, number[]>();
	const rightEdges = new Map<number, number[]>();

	for (const [dr, dc] of coords) {
		if (!occ.has((dr - 1) + ',' + dc)) {
			const edgeList = topEdges.get(dr) || [];
			edgeList.push(dc);
			topEdges.set(dr, edgeList);
		}
		if (!occ.has((dr + 1) + ',' + dc)) {
			const edgeList = bottomEdges.get(dr) || [];
			edgeList.push(dc);
			bottomEdges.set(dr, edgeList);
		}
		if (!occ.has(dr + ',' + (dc - 1))) {
			const edgeList = leftEdges.get(dc) || [];
			edgeList.push(dr);
			leftEdges.set(dc, edgeList);
		}
		if (!occ.has(dr + ',' + (dc + 1))) {
			const edgeList = rightEdges.get(dc) || [];
			edgeList.push(dr);
			rightEdges.set(dc, edgeList);
		}
	}

	function makeRuns(sortedList: number[]): Array<[number, number]> {
		const runs: Array<[number, number]> = [];
		if (!sortedList.length) return runs;
		let start = sortedList[0];
		let prev = sortedList[0];
		for (let i = 1; i < sortedList.length; i++) {
			const v = sortedList[i];
			if (v === prev + 1) {
				prev = v;
			}
			else {
				runs.push([start, prev]);
				start = v;
				prev = v;
			}
		}
		runs.push([start, prev]);
		return runs;
	}

	const segs: OutlineSegment[] = [];
	for (const [row, dcs] of topEdges.entries()) {
		const sorted = dcs.slice().sort((a: number, b: number) => a - b);
		const runs = makeRuns(sorted);
		for (const [dcStart, dcEnd] of runs) {
			const leftPx = offX + dcStart * cellStepX;
			const rightPx = offX + dcEnd * cellStepX + cellSize;
			const cellTopY = offY + row * cellStepY;
			const yPx = cellTopY - borderPx;
			segs.push({
				x: leftPx,
				y: yPx,
				w: rightPx - leftPx,
				h: borderPx,
			});
		}
	}
	for (const [row, dcs] of bottomEdges.entries()) {
		const sorted = dcs.slice().sort((a: number, b: number) => a - b);
		const runs = makeRuns(sorted);
		for (const [dcStart, dcEnd] of runs) {
			const leftPx = offX + dcStart * cellStepX;
			const rightPx = offX + dcEnd * cellStepX + cellSize;
			const cellBottomY = offY + row * cellStepY + cellSize;
			const yPx = cellBottomY;
			segs.push({
				x: leftPx,
				y: yPx,
				w: rightPx - leftPx,
				h: borderPx,
			});
		}
	}
	for (const [col, drs] of leftEdges.entries()) {
		const sorted = drs.slice().sort((a: number, b: number) => a - b);
		const runs = makeRuns(sorted);
		for (const [drStart, drEnd] of runs) {
			const topPx = offY + drStart * cellStepY;
			const bottomPx = offY + drEnd * cellStepY + cellSize;
			const cellLeftX = offX + col * cellStepX;
			const xPx = cellLeftX - borderPx;
			segs.push({
				x: xPx,
				y: topPx,
				w: borderPx,
				h: bottomPx - topPx,
			});
		}
	}
	for (const [col, drs] of rightEdges.entries()) {
		const sorted = drs.slice().sort((a: number, b: number) => a - b);
		const runs = makeRuns(sorted);
		for (const [drStart, drEnd] of runs) {
			const topPx = offY + drStart * cellStepY;
			const bottomPx = offY + drEnd * cellStepY + cellSize;
			const cellRightX = offX + col * cellStepX + cellSize;
			const xPx = cellRightX;
			segs.push({
				x: xPx,
				y: topPx,
				w: borderPx,
				h: bottomPx - topPx,
			});
		}
	}

	let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
	for (const [dr, dc] of coords) {
		if (dr < minR) minR = dr;
		if (dr > maxR) maxR = dr;
		if (dc < minC) minC = dc;
		if (dc > maxC) maxC = dc;
	}

	for (let r = minR - 1; r <= maxR + 1; r++) {
		for (let c = minC - 1; c <= maxC + 1; c++) {
			const hereKey = r + ',' + c;
			if (occ.has(hereKey)) continue;

			const up = occ.has((r - 1) + ',' + c);
			const down = occ.has((r + 1) + ',' + c);
			const left = occ.has(r + ',' + (c - 1));
			const right = occ.has(r + ',' + (c + 1));

			if (up && left && !down && !right) {
				const cornerX = offX + c * cellStepX - borderPx;
				const cornerY = offY + r * cellStepY - borderPx;
				segs.push({
					x: cornerX,
					y: cornerY,
					w: borderPx,
					h: borderPx,
				});
			}
			if (up && right && !down && !left) {
				const cornerX = offX + c * cellStepX + cellSize;
				const cornerY = offY + r * cellStepY - borderPx;
				segs.push({
					x: cornerX,
					y: cornerY,
					w: borderPx,
					h: borderPx,
				});
			}
			if (down && left && !up && !right) {
				const cornerX = offX + c * cellStepX - borderPx;
				const cornerY = offY + r * cellStepY + cellSize;
				segs.push({
					x: cornerX,
					y: cornerY,
					w: borderPx,
					h: borderPx,
				});
			}
			if (down && right && !up && !left) {
				const cornerX = offX + c * cellStepX + cellSize;
				const cornerY = offY + r * cellStepY + cellSize;
				segs.push({
					x: cornerX,
					y: cornerY,
					w: borderPx,
					h: borderPx,
				});
			}
		}
	}
	return segs;
}

export function appendOutlineBorderFull(container: HTMLElement, shapeCoords: ShapeCoord[]): void {
	const segs = buildOutlineSegments(shapeCoords, {
		cellStepX: CELL + CELL_GAP,
		cellStepY: CELL + CELL_GAP,
		cellSize: CELL,
		borderPx: 2,
		offX: 0,
		offY: 0,
	});

	for (const seg of segs) {
		const edgeDiv = document.createElement('div');
		edgeDiv.style.position = 'absolute';
		edgeDiv.style.left = seg.x + 'px';
		edgeDiv.style.top = seg.y + 'px';
		edgeDiv.style.width = seg.w + 'px';
		edgeDiv.style.height = seg.h + 'px';
		edgeDiv.style.background = '#E7E2DE';
		edgeDiv.style.pointerEvents = 'none';
		edgeDiv.style.zIndex = '10002';
		container.appendChild(edgeDiv);
	}
}

function appendOutlineBorderMini(container: HTMLElement, shapeCoords: ShapeCoord[], cellSize: number): void {
	const segs = buildOutlineSegments(shapeCoords, {
		cellStepX: cellSize,
		cellStepY: cellSize,
		cellSize,
		borderPx: 1,
		offX: 0,
		offY: 0,
	});

	for (const seg of segs) {
		const edgeDiv = document.createElement('div');
		edgeDiv.style.position = 'absolute';
		edgeDiv.style.left = seg.x + 'px';
		edgeDiv.style.top = seg.y + 'px';
		edgeDiv.style.width = seg.w + 'px';
		edgeDiv.style.height = seg.h + 'px';
		edgeDiv.style.background = '#DBD7D4';
		edgeDiv.style.pointerEvents = 'none';
		edgeDiv.style.zIndex = '10002';
		container.appendChild(edgeDiv);
	}
}
