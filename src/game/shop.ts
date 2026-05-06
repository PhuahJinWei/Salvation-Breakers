import { initializeShopCssVars } from './shopCss';
import { createShopDragController } from './shopDrag';
import { initializeShopGrid } from './shopElements';
import { configureShopOverlay, openShopOverlay } from './shopOverlay';
import { renderOffer as renderOfferView, renderPlaced as renderPlacedView } from './shopRender';
import { configureWeaponRemoval, renderWeaponRemovalRemovedList } from './shopRemoval';

initializeShopCssVars();
initializeShopGrid();

let onDragStart = createShopDragController({
	renderPlaced,
	renderOffer,
});

function renderPlaced(): void {
	renderPlacedView(onDragStart);
}

function renderOffer(): void {
	renderOfferView(onDragStart);
}

configureWeaponRemoval(renderOffer);
configureShopOverlay({ renderPlaced, renderOffer });

export { openShopOverlay, renderWeaponRemovalRemovedList };
