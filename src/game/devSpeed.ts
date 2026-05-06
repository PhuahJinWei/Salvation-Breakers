import { GAME_STATE } from './state';

// DEV TEST ONLY: hold Space to multiply the current game speed.
	// Remove this whole block and use GAME_STATE.speedMult directly in the loop when no longer needed.
	const DEV_TEST_SPACE_SPEED_MULT = 10;
	let devTestSpaceSpeedHeld = false;

	export function getEffectiveGameSpeedMult() {
		return GAME_STATE.speedMult * (devTestSpaceSpeedHeld ? DEV_TEST_SPACE_SPEED_MULT : 1);
	}

	document.addEventListener('keydown', e => {
		if (e.code !== 'Space') return;
		devTestSpaceSpeedHeld = true;
		e.preventDefault();
	});

	document.addEventListener('keyup', e => {
		if (e.code !== 'Space') return;
		devTestSpaceSpeedHeld = false;
		e.preventDefault();
	});

	window.addEventListener('blur', () => {
		devTestSpaceSpeedHeld = false;
	});
	// END DEV TEST ONLY
