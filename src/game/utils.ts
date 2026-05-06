import { WAVE_1_COUNT, WAVE_INCREASE, MOB_HP_PER_WAVE } from './config';

export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

export function roundRect(ctx,x,y,w,h,r) { 
	const m=Math.min(w,h)/2; r=Math.min(r,m);
	ctx.beginPath(); ctx.moveTo(x+r,y);
	ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
	ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

export function waveCountFor(n) {
	let c = WAVE_1_COUNT;
	for (let i = 1; i < n; i++) c = Math.max(1, Math.ceil(c * WAVE_INCREASE));
	return c;
}

export function scaleHP(baseHp, wave) {
	if (!wave || wave <= 1) return baseHp;
	return Math.round(baseHp * (1 + (wave - 1) * MOB_HP_PER_WAVE));
}

export function splitIntoGroups(total, groups) {
	const sizes = new Array(groups).fill(0);
	if (total <= 0) return sizes;
	const base = Math.floor(total / groups);
	let rem = total - base * groups;
	for (let i = 0; i < groups; i++) sizes[i] = base;
	while (rem-- > 0) sizes[Math.floor(Math.random()*groups)]++;
	for (let i = 0; i < groups; i++) if (sizes[i] === 0 && total >= groups) sizes[i] = 1;
	let sum = sizes.reduce((a,b)=>a+b,0);
	while (sum > total) { const i = sizes.findIndex(s=>s>1); sizes[i]--; sum--; }
	return sizes;
}
