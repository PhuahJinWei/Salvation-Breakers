import './styles.css';
import { configureCombatCallbacks } from './game/combat';
import { startGameLoop } from './game/runner';
import { openShopOverlay, renderWeaponRemovalRemovedList } from './game/shop';
import { configureUiCallbacks, enqueueTraitChoice, restart, show_gameoverOverlay } from './game/ui';

configureCombatCallbacks({ enqueueTraitChoice, showGameoverOverlay: show_gameoverOverlay, openShopOverlay });
configureUiCallbacks({ openShopOverlay, renderWeaponRemovalRemovedList });
startGameLoop();
restart();
