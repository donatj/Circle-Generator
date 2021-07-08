import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeInputControl, Control } from "../Controller";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";

export enum CircleModes {
	thick = 'thick',
	thin = 'thin',
	filled = 'filled',
}

function filled(x: number, y: number, radius: number, ratio: number): boolean {
	return distance(x, y, ratio) <= radius;
}

function fatfilled(x: number, y: number, radius: number, ratio: number): boolean {
	return filled(x, y, radius, ratio) && !(
		filled(x + 1, y, radius, ratio) &&
		filled(x - 1, y, radius, ratio) &&
		filled(x, y + 1, radius, ratio) &&
		filled(x, y - 1, radius, ratio) &&
		filled(x + 1, y + 1, radius, ratio) &&
		filled(x + 1, y - 1, radius, ratio) &&
		filled(x - 1, y - 1, radius, ratio) &&
		filled(x - 1, y + 1, radius, ratio)
	);
}

function thinfilled(x: number, y: number, radius: number, ratio: number): boolean {
	return fatfilled(x, y, radius, ratio) &&
		!(fatfilled(x + (x > 0 ? 1 : -1), y, radius, ratio)
			&& fatfilled(x, y + (y > 0 ? 1 : -1), radius, ratio));
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm = document.createElement('select');

	public readonly changeEmitter = new EventEmitter<void>();

	private widthControl = makeInputControl('width', "number", "5", () => {
		this.changeEmitter.trigger();
	});

	private heightControl = makeInputControl('height', "number", "5", () => {
		this.changeEmitter.trigger();
	});

	constructor() {
		for (const item of Object.keys(CircleModes)) {
			const opt = document.createElement('option');
			opt.innerText = item;
			this.circleModeControlElm.appendChild(opt);
		}

		this.circleModeControlElm.addEventListener('change', () => {
			this.setMode(this.circleModeControlElm.value as CircleModes);
			this.changeEmitter.trigger();
		})
	}

	public getControls(): Control[] {
		return [
			this.widthControl,
			this.heightControl,
			{ element: this.circleModeControlElm, title: 'Mode' },
		];
	}

	private mode: CircleModes = CircleModes.thick;

	public setMode(mode: CircleModes): void {
		this.mode = mode;
	}

	public getBounds(): Bounds {
		return {
			minX: 0,
			maxX: parseInt(this.widthControl.element.value, 10),

			minY: 0,
			maxY: parseInt(this.heightControl.element.value, 10),
		}
	}

	public isFilled(x: number, y: number): boolean {
		const bounds = this.getBounds();

		x = -.5 * (bounds.maxX - 2 * (x + .5));
		y = -.5 * (bounds.maxY - 2 * (y + .5));

		switch (this.mode) {
			case CircleModes.thick: {
				return fatfilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			case CircleModes.thin: {
				return thinfilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			default: {
				return filled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
		}
	}

}
