import { CANVAS_H, CANVAS_W, FRAME_H, FRAME_W } from './config';

type WiredButton = HTMLButtonElement & { _wired?: boolean };
type TimedElement = HTMLElement & { _hideTO?: ReturnType<typeof setTimeout> };

function getRequiredElement<T extends HTMLElement>(id: string): T {
	const el = document.getElementById(id);
	if (!el) throw new Error(`Missing DOM element: #${id}`);
	return el as T;
}

// ============= Display ============= //
export const root = document.documentElement;
root.style.setProperty('--frame-w', FRAME_W + 'px');
root.style.setProperty('--frame-h', FRAME_H + 'px');
root.style.setProperty('--canvas-h', CANVAS_H + 'px');

export const canvas = getRequiredElement<HTMLCanvasElement>('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

export const fitWrap = getRequiredElement<HTMLElement>('fitWrap');

function fitToViewport(): void {
	const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	const scaleW = vw / FRAME_W;
	const scaleH = vh / FRAME_H;
	const s = Math.min(scaleW, scaleH, 1);
	fitWrap.style.transform = `scale(${s})`;
}

window.addEventListener('resize', fitToViewport);
window.addEventListener('orientationchange', fitToViewport);
fitToViewport();

// ===== Soldier Facing Angle GIF ===== //
export const soldierSpriteEl = getRequiredElement<HTMLImageElement>('soldierSprite');
export const SOLDIER_ANGLES = [
	'/img/character_model_1_angle_1.gif',
	'/img/character_model_1_angle_2.gif',
	'/img/character_model_1_angle_3.gif',
	'/img/character_model_1_angle_4.gif',
	'/img/character_model_1_angle_5.gif',
];

SOLDIER_ANGLES.forEach((src) => {
	const image = new Image();
	image.src = src;
});

let soldierFacingIndex = 2;
soldierSpriteEl.src = SOLDIER_ANGLES[soldierFacingIndex];

// ============== Declare Element ID ============== //
const maybeCtx = canvas.getContext('2d');
if (!maybeCtx) throw new Error('Unable to initialize 2D canvas context.');
export const ctx = maybeCtx;

export const pauseOverlay = getRequiredElement<HTMLElement>('pauseOverlay');
export const gameoverOverlay = getRequiredElement<HTMLElement>('gameoverOverlay');
export const traitOverlay = getRequiredElement<HTMLElement>('traitOverlay');
export const dpsOverlay = getRequiredElement<HTMLElement>('dpsOverlay');

export const btn_resume = getRequiredElement<HTMLButtonElement>('btn_resume');
export const btn_quickend = getRequiredElement<HTMLButtonElement>('btn_quickend');
export const btn_restart = getRequiredElement<HTMLButtonElement>('btn_restart');
export const pauseBtn = getRequiredElement<HTMLButtonElement>('pauseBtn');
export const speedBtn = getRequiredElement<HTMLButtonElement>('speedBtn');
export const bossWarn = getRequiredElement<TimedElement>('bossWarn');
export const waveNumEl = getRequiredElement<HTMLElement>('waveNum');
export const levelNumEl = getRequiredElement<HTMLElement>('levelNum');
export const expFill = getRequiredElement<HTMLElement>('expFill');
export const coinNumEl = getRequiredElement<HTMLElement>('coinNum');
export const scoreNumEl = getRequiredElement<HTMLElement>('scoreNum');
export const traitCardsBox = getRequiredElement<HTMLElement>('traitCards');
export const traitOverlayViewer = getRequiredElement<HTMLElement>('traitOverlayViewer');
export const traitListBox = getRequiredElement<HTMLElement>('traitList');
export const closeTraitViewerBtn = getRequiredElement<HTMLButtonElement>('closeTraitViewerBtn');
export const traitStart = getRequiredElement<WiredButton>('traitStartBtn');
export const dpsList = getRequiredElement<HTMLElement>('dpsList');
export const btnDPS_close_view = getRequiredElement<HTMLButtonElement>('btnDPS_close_view');
export const overlay_pause_removal_list = getRequiredElement<HTMLElement>('overlay_pause_removal_list');
export const pauseTraitsGrid = getRequiredElement<HTMLElement>('pauseTraitsGrid');

export function updateSoldierFacingIndex(facingIndex: number): void {
	if (facingIndex !== soldierFacingIndex) {
		soldierFacingIndex = facingIndex;
		soldierSpriteEl.src = SOLDIER_ANGLES[soldierFacingIndex];
	}
}
