import { GUN_CONFIG } from './config';
import { CELL, CELL_GAP, GRID_COLS, GRID_MAGNET_MARGIN, GRID_ROWS, cellStep } from './shopConfig';
import { getShapeBounds } from './shopGunView';
import type { ShopItem } from './shopTypes';

export interface GridPosition {
	r: number;
	c: number;
}

export interface PixelSize {
	width: number;
	height: number;
}

export interface PixelPoint {
	x: number;
	y: number;
}

export interface ViewportPoint {
	left: number;
	top: number;
}

export function getShapeExtentsForKey(key: string): { maxDR: number; maxDC: number } {
	const shape = GUN_CONFIG[key].shape || [];
	let maxDR = 0;
	let maxDC = 0;

	for (const [dr, dc] of shape) {
		if (dr > maxDR) maxDR = dr;
		if (dc > maxDC) maxDC = dc;
	}

	return { maxDR, maxDC };
}

export function clampPlacementToGrid(item: ShopItem, baseR: number, baseC: number): GridPosition {
	return clampShapePlacementToGrid(item.key, baseR, baseC);
}

export function clampShapePlacementToGrid(key: string, baseR: number, baseC: number): GridPosition {
	const { maxDR, maxDC } = getShapeExtentsForKey(key);
	const maxRowStart = GRID_ROWS - 1 - maxDR;
	const maxColStart = GRID_COLS - 1 - maxDC;

	return {
		r: Math.max(0, Math.min(maxRowStart, baseR)),
		c: Math.max(0, Math.min(maxColStart, baseC)),
	};
}

export function getGridCssSize(): PixelSize {
	return {
		width: GRID_COLS * cellStep - CELL_GAP,
		height: GRID_ROWS * cellStep - CELL_GAP,
	};
}

export function getGridViewportScale(gridEl: HTMLElement = requireShopGrid()): number {
	const gridRect = gridEl.getBoundingClientRect();
	const gridSize = getGridCssSize();
	const scaleX = gridSize.width > 0 ? gridRect.width / gridSize.width : 1;
	const scaleY = gridSize.height > 0 ? gridRect.height / gridSize.height : scaleX;
	const scale = Math.min(scaleX || 1, scaleY || scaleX || 1);

	return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

export function getFullShapePixelSize(item: ShopItem): PixelSize {
	const { cellCols, cellRows } = getShapeBounds(item.key);
	return {
		width: (cellCols - 1) * cellStep + CELL,
		height: (cellRows - 1) * cellStep + CELL,
	};
}

export function getPointerOffsetInFullShape(
	event: PointerEvent,
	sourceEl: HTMLElement | null,
	item: ShopItem,
): PixelPoint {
	const shapeSize = getFullShapePixelSize(item);
	const sourceRect = sourceEl?.getBoundingClientRect?.();

	if (!sourceRect || sourceRect.width <= 0 || sourceRect.height <= 0) {
		return {
			x: shapeSize.width / 2,
			y: shapeSize.height / 2,
		};
	}

	const xRatio = Math.max(0, Math.min(1, (event.clientX - sourceRect.left) / sourceRect.width));
	const yRatio = Math.max(0, Math.min(1, (event.clientY - sourceRect.top) / sourceRect.height));

	return {
		x: xRatio * shapeSize.width,
		y: yRatio * shapeSize.height,
	};
}

export function getGridLocalPoint(
	clientX: number,
	clientY: number,
	gridEl: HTMLElement = requireShopGrid(),
): PixelPoint {
	const gridRect = gridEl.getBoundingClientRect();
	const scale = getGridViewportScale(gridEl);

	return {
		x: (clientX - gridRect.left) / scale,
		y: (clientY - gridRect.top) / scale,
	};
}

export function getPreviewTopLeftPixels(
	r: number,
	c: number,
	gridEl: HTMLElement = requireShopGrid(),
): ViewportPoint {
	const gridRect = gridEl.getBoundingClientRect();
	const scale = getGridViewportScale(gridEl);

	return {
		left: gridRect.left + c * cellStep * scale,
		top: gridRect.top + r * cellStep * scale,
	};
}

export function snapToGrid(
	clientX: number,
	clientY: number,
	grabOffsetX: number,
	grabOffsetY: number,
	gridEl: HTMLElement = requireShopGrid(),
): GridPosition {
	const p = getGridLocalPoint(clientX, clientY, gridEl);
	return {
		r: Math.round((p.y - grabOffsetY) / cellStep),
		c: Math.round((p.x - grabOffsetX) / cellStep),
	};
}

export function isInGridMagnetZone(
	x: number,
	y: number,
	gridEl: HTMLElement = requireShopGrid(),
): boolean {
	const r = gridEl.getBoundingClientRect();
	const margin = GRID_MAGNET_MARGIN * getGridViewportScale(gridEl);
	return (
		x >= r.left - margin &&
		x <= r.right + margin &&
		y >= r.top - margin &&
		y <= r.bottom + margin
	);
}

export function getShapeCellsAt(item: ShopItem, baseR: number, baseC: number): Array<[number, number]> {
	return getShapeCellsForKey(item.key, baseR, baseC);
}

export function getShapeCellsForKey(key: string, baseR: number, baseC: number): Array<[number, number]> {
	const shape = GUN_CONFIG[key].shape || [];
	return shape.map(([dr, dc]) => [baseR + dr, baseC + dc]);
}

export class PlacementPreview {
	private wrap: HTMLDivElement | null = null;

	constructor(private readonly gridEl: HTMLElement = requireShopGrid()) {}

	show(r: number, c: number, item: ShopItem, valid: boolean): void {
		this.ensureWrap();
		if (!this.wrap) return;

		this.wrap.innerHTML = '';

		for (const [dr, dc] of GUN_CONFIG[item.key].shape) {
			const cell = document.createElement('div');
			cell.className = 'placement-preview-cell' + (valid ? '' : ' invalid');

			const baseLeft = c * (CELL + CELL_GAP);
			const baseTop = r * (CELL + CELL_GAP);
			cell.style.left = (baseLeft + dc * (CELL + CELL_GAP)) + 'px';
			cell.style.top = (baseTop + dr * (CELL + CELL_GAP)) + 'px';
			cell.style.width = CELL + 'px';
			cell.style.height = CELL + 'px';
			cell.style.position = 'absolute';
			cell.style.backgroundImage = "url('/img/UI_shop_slot_background_preview.png')";
			cell.style.backgroundRepeat = 'no-repeat';
			cell.style.backgroundSize = '100% 100%';
			cell.style.backgroundPosition = 'center';
			cell.style.opacity = valid ? '1' : '0.8';
			this.wrap.appendChild(cell);
		}

		this.wrap.style.display = 'block';
	}

	hide(): void {
		if (this.wrap) this.wrap.style.display = 'none';
	}

	private ensureWrap(): void {
		if (this.wrap) return;

		this.wrap = document.createElement('div');
		this.wrap.className = 'placement-preview';
		this.gridEl.appendChild(this.wrap);
	}
}

function requireShopGrid(): HTMLElement {
	const gridEl = document.getElementById('shopGrid');
	if (!gridEl) throw new Error('Missing shop grid element.');
	return gridEl;
}
