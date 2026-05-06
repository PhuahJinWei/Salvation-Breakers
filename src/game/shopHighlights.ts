import { shopGridEl, shopOfferEl } from './shopElements';
import { mergeHighlightSet } from './shopState';

export function applyMergeHighlights(): void {
	document.querySelectorAll('.merge-glow').forEach((el) => {
		el.classList.remove('merge-glow');
	});

	for (const id of mergeHighlightSet) {
		const placed = shopGridEl?.querySelector(`.gun-placed[data-id="${id}"]`);
		if (placed) placed.classList.add('merge-glow');

		const chip = shopOfferEl?.querySelector(`.gun-chip[data-id="${id}"]`);
		if (chip) chip.classList.add('merge-glow');
	}
}

export function clearMergeHighlights(): void {
	document.querySelectorAll('.merge-glow').forEach((el) => {
		el.classList.remove('merge-glow');
	});
	mergeHighlightSet.clear();
}
