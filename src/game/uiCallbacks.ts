export const uiCallbacks: {
	openShopOverlay: (nextWave: number, nextCount: number, initial?: boolean, view?: boolean) => void;
	renderWeaponRemovalRemovedList: (element: HTMLElement) => void;
} = {
	openShopOverlay: () => {},
	renderWeaponRemovalRemovedList: () => {},
};

export function configureUiCallbacks(callbacks: Partial<typeof uiCallbacks>): void {
	Object.assign(uiCallbacks, callbacks);
}
