import { GeneratorInterface2D } from "./GeneratorInterface2D";
import { ControlAwareInterface } from "../Controller";
import { distance } from "../Math";

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

	private circleModeControl = document.createElement('select')

	constructor(private width: number, private height: number) {
		for (const item of Object.keys(CircleModes)) {
			const opt = document.createElement('option');
			opt.innerText = item;
			this.circleModeControl.appendChild(opt);
		}

		this.circleModeControl.addEventListener('change', ()=>{
			this.setMode(this.circleModeControl.value as CircleModes)
		})
	}

	public getControls() {
		return [this.circleModeControl];
	}

	private mode: CircleModes = CircleModes.thick;

	public setMode(mode: CircleModes): void {
		this.mode = mode;
	}

	public isFilled(x: number, y: number): boolean {
		x = -.5 * (this.width - 2 * (x + .5));
		y = -.5 * (this.height - 2 * (y + .5));

		switch (this.mode) {
			case CircleModes.thick: {
				return fatfilled(x, y, (this.width / 2), this.width / this.height);
			}
			case CircleModes.thin: {
				return thinfilled(x, y, (this.width / 2), this.width / this.height);
			}
			default: {
				return filled(x, y, (this.width / 2), this.width / this.height);
			}
		}
	}

}
