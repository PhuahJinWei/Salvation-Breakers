import { GAME_STATE } from './state';

// ================= Sound Effects ================= //
	export const bgm = new Audio('/sfx/bgm_battlefield_loop.mp3');
	bgm.loop = true;
	bgm.preload = 'auto';
	bgm.volume = 0.4;

	const BGM_VOLUME = 0.4;
	let bgmFadeId = null;
	let bgmTargetVolume = BGM_VOLUME;

	function isPageFocused() {
		const hasFocus = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
		return document.visibilityState !== 'hidden' && hasFocus;
	}

	function shouldBgmPlay() {
		return isPageFocused() && GAME_STATE.paused !== true;
	}

	function fadeBgmTo(to, ms = 200) {
		if (bgmFadeId) {
			clearInterval(bgmFadeId);
			bgmFadeId = null;
		}

		bgmTargetVolume = to;
		const from = bgm.volume;
		const steps = Math.max(1, Math.floor(ms / 16));
		let i = 0;

		if (to > 0 && bgm.paused) bgm.play().catch(()=>{});

		bgmFadeId = setInterval(() => {
			i++;
			bgm.volume = from + (to - from) * (i / steps);
			if (i >= steps) {
				clearInterval(bgmFadeId);
				bgmFadeId = null;
				bgm.volume = to;
				if (to === 0) bgm.pause();
			}
		}, 16);
	}

	export function syncBgmPlayback(reset=false) {
		if (reset) bgm.currentTime = 0;
		const target = shouldBgmPlay() ? BGM_VOLUME : 0;
		if (target === bgmTargetVolume && !(target > 0 && bgm.paused)) return;
		fadeBgmTo(target, 200);
	}
	
	document.addEventListener('pointerdown', function unlock() {
		bgm.play().then(() => {
			if (!shouldBgmPlay()) bgm.pause();
			syncBgmPlayback();
		}).catch(()=>{});
		const a = new Audio();
		a.play().catch(()=>{}).finally(()=>a.pause());
		document.removeEventListener('pointerdown', unlock);
	}, { once: true });
	export function ensureBgmPlaying(reset=false){
		syncBgmPlayback(reset);
	}
	
	//play audio (stackable)
	export function makeSfx(path, { volume = 0.6, pool = 4 } = {}) {
		const poolArr = Array.from({ length: pool }, () => {
			const a = new Audio(path);
			a.preload = 'auto';
			a.volume = volume;
			return a;
		});
		let i = 0;
		return () => {
			const a = poolArr[i];
			i = (i + 1) % poolArr.length;
			a.currentTime = 0;
			a.play().catch(() => {}); // ignore autoplay guards
		};
	}
	//play audio (non-stackable same audio)
	export function makeSfxNoOverlapWithin(path, { volume = 0.6, pool = 4, minGapMs = 1000 } = {}) {
		const poolArr = Array.from({ length: pool }, () => {
			const a = new Audio(path);
			a.preload = 'auto';
			a.volume = volume;
			return a;
		});
		let i = 0;
		let lastPlay = 0;

		const unlockOnce = () => {
			poolArr[0].play().then(() => poolArr[0].pause()).catch(() => {});
			window.removeEventListener('pointerdown', unlockOnce);
		};
		window.addEventListener('pointerdown', unlockOnce, { once: true });

		return function play() {
			const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
			if (now - lastPlay < minGapMs) return;
			lastPlay = now;

			const a = poolArr[i];
			i = (i + 1) % poolArr.length;
			try { a.currentTime = 0; } catch (_) {}
			a.play().catch(() => {});
		};
	}
	//Pause Audio
	export function fadeAudio(a, to, ms = 200) {
		const from=a.volume, steps=Math.max(1,Math.floor(ms/16)); let i=0;
		if (to>0 && a.paused) a.play().catch(()=>{});
		const id=setInterval(()=>{ i++; a.volume = from + (to-from)*(i/steps);
		if(i>=steps){ clearInterval(id); if(to===0) a.pause(); }},16);
	}
	
	
	
	// ---------- SFX Config ----------
	export const SFX_ERROR = makeSfx('/sfx/sfx_error.mp3',{});
	
	export const SFX_BTN_DEFAULT = makeSfx('/sfx/buttons/sfx_btn_default.mp3', {});
	export const SFX_BTN_PAUSE = makeSfx('/sfx/buttons/sfx_btn_pause.mp3',{});
	export const SFX_BTN_TRAIT_CARD = makeSfx('/sfx/buttons/trait_overlay_btn_select.mp3',{});
	export const SFX_BTN_SHOP_REROLL = makeSfx('/sfx/buttons/shop_btn_reroll.mp3',{});
	export const SFX_BTN_SHOP_CLOSE = makeSfx('/sfx/overlay_close_shop_overlay.mp3',{});
	
	export const SFX_OVERLAY_APPEAR_SHOP = makeSfx('/sfx/overlay_appear_shop_overlay.mp3',{});
	export const SFX_OVERLAY_APPEAR_TRAIT = makeSfx('/sfx/overlay_appear_trait.mp3',{});
	export const SFX_MOB_DEATH = makeSfx('/sfx/sfx_mob_death.mp3',{});
	export const SFX_GAMEOVER = makeSfx('/sfx/sfx_gameover.mp3',{});
	
	export const SFX_PLAY_BGM = () => syncBgmPlayback();
	export const SFX_PAUSE_BGM = () => fadeBgmTo(0, 200);

	document.addEventListener('visibilitychange', () => syncBgmPlayback());
	window.addEventListener('focus', () => syncBgmPlayback());
	window.addEventListener('blur', () => syncBgmPlayback());
	
	// ---------- Attach SFX to buttons ----------
	document.querySelectorAll<HTMLElement>('.default-div-btn').forEach(el => {
		if (el.dataset && el.dataset.sfx) return;
		el.addEventListener('click', SFX_BTN_DEFAULT);
	});
	
	
	// ---------- Gun fire SFX ----------
	export const SFX_GUN_FIRE_CACHE = new Map();
	export function playGunFire(name){
		const slug = String(name);
		if (!SFX_GUN_FIRE_CACHE.has(slug)) {
			SFX_GUN_FIRE_CACHE.set(slug, makeSfxNoOverlapWithin(`/sfx/gun_shot/fire_gun_${slug}.mp3`, { volume: 0.8, pool: 6, minGapMs: 500 }));
		}
		try { SFX_GUN_FIRE_CACHE.get(slug)(); } catch (e) {}
	}
