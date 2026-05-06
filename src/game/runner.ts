import { resetGameLoopTiming, runGameFrame } from './loop';

let rafId: number | null = null;
let lastTime = 0;
let visibilityListenerInstalled = false;

function resetBrowserFrameTiming(): void {
	lastTime = performance.now();
	resetGameLoopTiming();
}

function handleVisibilityChange(): void {
	if (document.visibilityState === 'visible') {
		resetBrowserFrameTiming();
	}
}

function installVisibilityListener(): void {
	if (visibilityListenerInstalled) return;

	document.addEventListener('visibilitychange', handleVisibilityChange);
	visibilityListenerInstalled = true;
}

function removeVisibilityListener(): void {
	if (!visibilityListenerInstalled) return;

	document.removeEventListener('visibilitychange', handleVisibilityChange);
	visibilityListenerInstalled = false;
}

export function startGameLoop(): void {
	if (rafId !== null) return;

	resetBrowserFrameTiming();
	installVisibilityListener();

	const frame = (now: number): void => {
		if (rafId === null) return;

		const rawDt = (now - lastTime) / 1000;
		lastTime = now;

		runGameFrame(rawDt);
		rafId = requestAnimationFrame(frame);
	};

	rafId = requestAnimationFrame(frame);
}

export function stopGameLoop(): void {
	if (rafId === null) return;

	cancelAnimationFrame(rafId);
	rafId = null;
	removeVisibilityListener();
	resetGameLoopTiming();
}
