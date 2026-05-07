import { makeSfx } from './audio';
import { publicAssetPath } from './assets';
import { CELL, GHOST_GRID_OFFSET_X, GHOST_GRID_OFFSET_Y, cellStep, num_shop_offer_max_item } from './shopConfig';
import { shopGridEl } from './shopElements';
import { getShapeBounds } from './shopGunView';
import { applyMergeHighlights, clearMergeHighlights } from './shopHighlights';
import { canMergeItems, countPlaced, resolveDropOnGrid, mergeIntoTarget } from './shopMerge';
import {
	PlacementPreview,
	clampPlacementToGrid,
	getGridViewportScale,
	getPointerOffsetInFullShape,
	getPreviewTopLeftPixels,
	isInGridMagnetZone,
	snapToGrid,
} from './shopPlacement';
import { applyOfferDropFallback, shouldReturnDraggedGridItemToStart, type DragStartPosition, type ShopDragSource } from './shopDragRules';
import { mergeHighlightSet, shopState } from './shopState';
import type { ShopItem } from './shopTypes';

export type ShopDragStartHandler = (
	event: PointerEvent,
	item: ShopItem,
	from: ShopDragSource,
	sourceEl: HTMLElement,
) => void;

interface DragSnap {
	r: number;
	c: number;
	ok: boolean;
}

interface ShopDragDeps {
	renderPlaced: () => void;
	renderOffer: () => void;
}

export function createShopDragController({ renderPlaced, renderOffer }: ShopDragDeps): ShopDragStartHandler {
	if (!shopGridEl) throw new Error('Missing shop grid element.');
	const gridEl = shopGridEl;

	let ghost: HTMLDivElement | null = null;
	let dragFrom: ShopDragSource | null = null;
	let startPos: DragStartPosition | null = null;
	let activePointerId: number | null = null;
	let draggingItem: ShopItem | null = null;
	let draggingSourceEl: HTMLElement | null = null;
	let lastSnap: DragSnap | null = null;
	let grabOffsetX = 0;
	let grabOffsetY = 0;

	const preview = new PlacementPreview(gridEl);

	function resolveDropInOffer(event: PointerEvent, item: ShopItem): void {
		const offerCount = shopState.items.filter((it) => it.r == null && it.c == null && it !== item).length;
		const elUnder = document.elementFromPoint(event.clientX, event.clientY);
		const chipEl = elUnder ? elUnder.closest<HTMLElement>('.gun-chip') : null;

		if (chipEl) {
			const targetId = chipEl.dataset.id;
			const targetItem = shopState.items.find((it) => String(it.id) === String(targetId));
			if (targetItem) {
				const canMerge = targetItem !== item && canMergeItems(item, targetItem);

				if (canMerge) {
					const cameFromGridAndWasLast = dragFrom === 'grid' && countPlaced() <= 1;
					if (!cameFromGridAndWasLast) {
						mergeIntoTarget(targetItem, item);
						playMergeSfx();
						return;
					}
				}

				if (shouldReturnToStart(offerCount)) {
					applyOfferDropFallback(item, startPos, getOfferDropRuleInput(offerCount));
				}
				else {
					item.r = null;
					item.c = null;
				}
				return;
			}
		}

		applyOfferDropFallback(item, startPos, getOfferDropRuleInput(offerCount));
	}

	function shouldReturnToStart(offerCount: number): boolean {
		return shouldReturnDraggedGridItemToStart(getOfferDropRuleInput(offerCount));
	}

	function getOfferDropRuleInput(offerCount: number) {
		return {
			dragFrom,
			offerCountWithoutItem: offerCount,
			placedCount: countPlaced(),
			maxOfferItems: num_shop_offer_max_item,
		};
	}

	function applyGhostViewportScale(): void {
		if (!ghost) return;
		ghost.style.transformOrigin = 'top left';
		ghost.style.transform = `scale(${getGridViewportScale(gridEl)})`;
	}

	function setGhostOverGrid(overGrid: boolean): void {
		ghost?.classList.toggle('over-grid', overGrid);
	}

	function setGhostPosition(left: number, top: number): void {
		if (!ghost) return;
		applyGhostViewportScale();
		ghost.style.left = left + 'px';
		ghost.style.top = top + 'px';
	}

	function positionGhostAtPreview(r: number, c: number): void {
		if (!ghost) return;
		setGhostOverGrid(true);
		const { left, top } = getPreviewTopLeftPixels(r, c, gridEl);
		const scale = getGridViewportScale(gridEl);
		setGhostPosition(
			left + GHOST_GRID_OFFSET_X * scale,
			top + GHOST_GRID_OFFSET_Y * scale,
		);
	}

	function positionGhostFromPointer(pointerX: number, pointerY: number): void {
		if (!ghost) return;
		setGhostOverGrid(false);
		const scale = getGridViewportScale(gridEl);
		setGhostPosition(
			pointerX - grabOffsetX * scale,
			pointerY - grabOffsetY * scale,
		);
	}

	function onDragStart(event: PointerEvent, item: ShopItem, from: ShopDragSource, sourceEl: HTMLElement): void {
		if (draggingItem) return;
		event.preventDefault();

		activePointerId = event.pointerId ?? null;
		draggingItem = item;
		dragFrom = from;
		draggingSourceEl = sourceEl || null;
		startPos = { r: item.r, c: item.c };

		mergeHighlightSet.clear();
		for (const other of shopState.items) {
			if (other === item) continue;
			if (canMergeItems(item, other)) mergeHighlightSet.add(other.id);
		}

		applyMergeHighlights();
		ghost = createGhostFromItem(item);
		draggingSourceEl?.classList.add('drag-hidden');

		const grabOffset = getPointerOffsetInFullShape(event, draggingSourceEl, item);
		grabOffsetX = grabOffset.x;
		grabOffsetY = grabOffset.y;

		const captureTarget = event.target instanceof Element ? event.target : null;
		if (captureTarget?.setPointerCapture && activePointerId != null) {
			try { captureTarget.setPointerCapture(activePointerId); } catch (_) {}
		}

		window.addEventListener('pointermove', onDragMove, { passive: false });
		window.addEventListener('pointerup', onDragEnd, { passive: false, once: true });
		window.addEventListener('pointercancel', onDragEnd, { passive: false, once: true });

		if (item.r != null && item.c != null) {
			lastSnap = { r: item.r, c: item.c, ok: true };
			preview.show(item.r, item.c, item, true);
			positionGhostAtPreview(item.r, item.c);
		}
		else if (isInGridMagnetZone(event.clientX, event.clientY, gridEl)) {
			const snap = snapToGrid(event.clientX, event.clientY, grabOffsetX, grabOffsetY, gridEl);
			const { r, c } = clampPlacementToGrid(item, snap.r, snap.c);
			lastSnap = { r, c, ok: true };
			preview.show(r, c, item, true);
			positionGhostAtPreview(r, c);
		}
		else {
			lastSnap = null;
			preview.hide();
			positionGhostFromPointer(event.clientX, event.clientY);
		}

		makeSfx(`/sfx/shop/shop_item_pickup_${item.key}.mp3`, { volume: 0.8, pool: 2 })();
	}

	function onDragMove(event: PointerEvent): void {
		if (activePointerId != null && event.pointerId !== activePointerId) return;
		event.preventDefault();
		if (!draggingItem) return;

		if (!isInGridMagnetZone(event.clientX, event.clientY, gridEl)) {
			lastSnap = null;
			preview.hide();
			positionGhostFromPointer(event.clientX, event.clientY);
			return;
		}

		const snap = snapToGrid(event.clientX, event.clientY, grabOffsetX, grabOffsetY, gridEl);
		const { r, c } = clampPlacementToGrid(draggingItem, snap.r, snap.c);
		lastSnap = { r, c, ok: true };
		preview.show(r, c, draggingItem, true);
		positionGhostAtPreview(r, c);
	}

	function onDragEnd(event: PointerEvent): void {
		if (activePointerId != null && event.pointerId !== activePointerId) return;
		event.preventDefault();
		if (!draggingItem) return;

		window.removeEventListener('pointermove', onDragMove);
		window.removeEventListener('pointerup', onDragEnd);
		window.removeEventListener('pointercancel', onDragEnd);

		const releaseTarget = event.target instanceof Element ? event.target : null;
		if (releaseTarget?.releasePointerCapture && activePointerId != null) {
			try { releaseTarget.releasePointerCapture(activePointerId); } catch (_) {}
		}

		activePointerId = null;
		draggingSourceEl?.classList.remove('drag-hidden');
		ghost?.remove();
		ghost = null;
		preview.hide();

		const item = draggingItem;
		draggingItem = null;
		clearMergeHighlights();

		if (lastSnap?.ok) {
			const result = resolveDropOnGrid(item, lastSnap.r, lastSnap.c);
			if (result.merged) playMergeSfx();
		}
		else {
			resolveDropInOffer(event, item);
		}

		lastSnap = null;
		renderPlaced();
		renderOffer();
		makeSfx(`/sfx/shop/shop_item_place_${item.key}.mp3`, { volume: 0.8, pool: 2 })();
	}

	return onDragStart;
}

function playMergeSfx(): void {
	makeSfx('/sfx/shop/shop_item_merge.mp3', { volume: 0.8, pool: 2 })();
}

function createGhostFromItem(item: ShopItem): HTMLDivElement {
	const g = document.createElement('div');
	g.className = 'drag-ghost';
	g.style.zIndex = '10001';
	g.style.pointerEvents = 'none';
	g.style.touchAction = 'none';
	g.style.position = 'fixed';

	const { cellCols, cellRows } = getShapeBounds(item.key);
	const shapeWidthPx = (cellCols - 1) * cellStep + CELL;
	const shapeHeightPx = (cellRows - 1) * cellStep + CELL;
	g.style.width = shapeWidthPx + 'px';
	g.style.height = shapeHeightPx + 'px';

	const spriteMini = document.createElement('img');
	spriteMini.className = 'gun-sprite-mini';
	spriteMini.src = publicAssetPath('/img/item/shop/gun_shop_' + item.key + '.png');
	spriteMini.style.position = 'absolute';
	spriteMini.style.width = shapeWidthPx + 'px';
	spriteMini.style.height = shapeHeightPx + 'px';
	spriteMini.style.objectFit = 'contain';
	spriteMini.style.pointerEvents = 'none';
	g.appendChild(spriteMini);

	document.body.appendChild(g);
	return g;
}
