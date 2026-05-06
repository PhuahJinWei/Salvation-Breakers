export interface SpriteSheetAnimationConfig {
	src: string;
	frameCount: number;
	fps: number;
}

export interface SpriteFrame {
	sx: number;
	sy: number;
	sw: number;
	sh: number;
}

export class SpriteSheetAnimation {
	readonly image: HTMLImageElement;
	readonly frameCount: number;
	readonly fps: number;

	constructor(config: SpriteSheetAnimationConfig) {
		this.image = new Image();
		this.image.src = config.src;
		this.frameCount = Math.max(1, Math.floor(config.frameCount));
		this.fps = Math.max(0, config.fps);
	}

	get loaded(): boolean {
		return this.image.complete && this.image.naturalWidth > 0 && this.image.naturalHeight > 0;
	}

	getFrame(time: number): SpriteFrame {
		const frameW = this.image.naturalWidth / this.frameCount;
		const frameH = this.image.naturalHeight;
		const frameIndex = this.fps > 0
			? Math.floor(time * this.fps) % this.frameCount
			: 0;

		return {
			sx: frameIndex * frameW,
			sy: 0,
			sw: frameW,
			sh: frameH,
		};
	}

	draw(ctx: CanvasRenderingContext2D, time: number, x: number, y: number, w: number, h: number): boolean {
		if (!this.loaded) return false;

		const frame = this.getFrame(time);
		ctx.drawImage(this.image, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
		return true;
	}
}
