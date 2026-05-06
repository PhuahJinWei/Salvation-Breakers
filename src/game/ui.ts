import {
	btnDPS_close_view,
	btn_quickend,
	btn_restart,
	btn_resume,
	closeTraitViewerBtn,
	pauseBtn,
	speedBtn,
} from './dom';
import { closeDpsOverlay, openDpsOverlay, updateDpsOverlay } from './uiDpsOverlay';
import { renderInventory, updateInventoryCooldownUI } from './uiInventory';
import { core_game_speed, hidden_pauseOverlay, restart, show_gameoverOverlay, show_pauseOverlay } from './uiPauseGameover';
import { configureUiCallbacks, uiCallbacks } from './uiCallbacks';
import { applyTrait, enqueueTraitChoice, hasPendingTraitChoices } from './uiTraitOverlay';
import { closeTraitViewer, openTraitViewer, updatePauseTraitGrid, updateTraitViewer } from './uiTraitViewer';

btn_resume.addEventListener('click', hidden_pauseOverlay);
btn_quickend.addEventListener('click', show_gameoverOverlay);
btn_restart.addEventListener('click', restart);
pauseBtn.addEventListener('click', show_pauseOverlay);
speedBtn.addEventListener('click', core_game_speed);

document.querySelectorAll<HTMLElement>('.btn_viewTraits').forEach((btn) => {
	btn.addEventListener('click', openTraitViewer);
});

document.querySelectorAll<HTMLElement>('.btn_viewInventory').forEach((btn) => {
	btn.addEventListener('click', () => {
		uiCallbacks.openShopOverlay(0, 0, false, true);
	});
});

closeTraitViewerBtn.addEventListener('click', closeTraitViewer);

document.querySelectorAll<HTMLElement>('.btn_view_dps').forEach((btn) => {
	btn.addEventListener('click', openDpsOverlay);
});

btnDPS_close_view.addEventListener('click', closeDpsOverlay);

export {
	applyTrait,
	closeDpsOverlay,
	closeTraitViewer,
	configureUiCallbacks,
	core_game_speed,
	enqueueTraitChoice,
	hasPendingTraitChoices,
	hidden_pauseOverlay,
	openDpsOverlay,
	openTraitViewer,
	renderInventory,
	restart,
	show_gameoverOverlay,
	show_pauseOverlay,
	updateDpsOverlay,
	updateInventoryCooldownUI,
	updatePauseTraitGrid,
	updateTraitViewer,
};
