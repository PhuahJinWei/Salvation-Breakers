import { GUN_CONFIG } from './config';
import { publicAssetPath, publicAssetUrl } from './assets';
import { CELL, MINI_CELL, cellStep } from './shopConfig';
import { shopGridEl, shopOfferEl } from './shopElements';
import { appendOutlineBorderFull, createGunShapeElement, getShapeBounds, getShopOfferItemScale, updateShopOfferLayout } from './shopGunView';
import { applyMergeHighlights } from './shopHighlights';
import { shopState } from './shopState';
import type { ShopItem } from './shopTypes';

type DragStartHandler = (
	event: PointerEvent,
	item: ShopItem,
	from: 'grid' | 'offer',
	sourceEl: HTMLElement,
) => void;

export function renderPlaced(onDragStart: DragStartHandler): void {
	if (!shopGridEl) return;

	shopGridEl.querySelectorAll('.gun-placed').forEach((n) => n.remove());

	for (const it of shopState.items) {
		if (it.r == null || it.c == null) continue;

		const { cellCols, cellRows } = getShapeBounds(it.key);
		const shapeWidthPx = (cellCols - 1) * cellStep + CELL;
		const shapeHeightPx = (cellRows - 1) * cellStep + CELL;

		const anchorX = it.c * cellStep;
		const anchorY = it.r * cellStep;
		const shapeCoords = GUN_CONFIG[it.key].shape;
		let maxDR = 0;
		let maxDC = 0;
		for (const [dr, dc] of shapeCoords) {
			if (dr > maxDR) maxDR = dr;
			if (dc > maxDC) maxDC = dc;
		}
		const wrapW = maxDC * cellStep + CELL;
		const wrapH = maxDR * cellStep + CELL;

		const wrap = document.createElement('div');
		wrap.className = 'gun-placed';
		wrap.dataset.id = it.id;
		wrap.style.position = 'absolute';
		wrap.style.left = anchorX + 'px';
		wrap.style.top = anchorY + 'px';
		wrap.style.width = wrapW + 'px';
		wrap.style.height = wrapH + 'px';
		wrap.style.pointerEvents = 'auto';

		for (const [dr, dc] of GUN_CONFIG[it.key].shape) {
			const cell = document.createElement('div');
			cell.className = 'p-cell';
			cell.dataset.dr = String(dr);
			cell.dataset.dc = String(dc);
			cell.style.position = 'absolute';
			cell.style.left = (dc * cellStep) + 'px';
			cell.style.top = (dr * cellStep) + 'px';
			cell.style.width = CELL + 'px';
			cell.style.height = CELL + 'px';
			cell.style.backgroundImage = publicAssetUrl('/img/UI_shop_slot_background_tier_' + it.tier + '.png');
			cell.style.backgroundSize = '100% 100%';
			cell.style.backgroundRepeat = 'no-repeat';
			cell.style.backgroundPosition = 'center';
			cell.style.borderRadius = '0';
			cell.style.boxShadow = 'none';
			wrap.appendChild(cell);
		}

		const sprite = document.createElement('img');
		sprite.className = 'gun-sprite';
		sprite.src = publicAssetPath('/img/item/shop/gun_shop_' + it.key + '.png');
		sprite.style.width = shapeWidthPx + 'px';
		sprite.style.height = shapeHeightPx + 'px';
		sprite.style.objectFit = 'contain';
		wrap.appendChild(sprite);

		appendOutlineBorderFull(wrap, GUN_CONFIG[it.key].shape);
		wrap.addEventListener('pointerdown', (e) => {
			if (document.getElementById('shopGrid')?.classList.contains('viewMode')) return;
			onDragStart(e, it, 'grid', wrap);
		});
		shopGridEl.appendChild(wrap);
	}
	applyMergeHighlights();
}

export function renderOffer(onDragStart: DragStartHandler): void {
	if (!shopOfferEl) return;

	shopOfferEl.innerHTML = '';
	shopOfferEl.classList.add('shop-offer-main');

	const offerItems = shopState.items.filter((it) => it.r == null && it.c == null);
	const offerItemScale = getShopOfferItemScale(offerItems.length, shopOfferEl);
	updateShopOfferLayout(shopOfferEl, offerItems.length);

	for (const it of offerItems) {
		const slot = document.createElement('div');
		slot.className = 'shop-offer-slot';

		const chip = createGunShapeElement(it.key, it.tier, MINI_CELL * offerItemScale, 'gun-chip');
		chip.dataset.id = it.id;
		chip.addEventListener('pointerdown', (e) => onDragStart(e, it, 'offer', chip));
		slot.appendChild(chip);
		shopOfferEl.appendChild(slot);
	}
	applyMergeHighlights();
}
