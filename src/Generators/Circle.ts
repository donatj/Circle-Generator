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
	return filled(x, y, radius, ratio) && !(
		filled(x + 1, y, radius, ratio) &&
		filled(x - 1, y, radius, ratio) &&
		filled(x, y + 1, radius, ratio) &&
		filled(x, y - 1, radius, ratio)
	);
}

interface CircleState {
	mode: CircleModes;
	width: number;
	height: number;
	force: boolean;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm = document.createElement('select');

	public readonly changeEmitter = new EventEmitter<{ event: string, state: CircleState }>();

	private widthControl: Control<HTMLInputElement>;
	private heightControl: Control<HTMLInputElement>;
	private forceCircleControl: Control<HTMLInputElement>;

	constructor(
		private width: number, 
		private height: number, 
		private mode : CircleModes, 
		private force : boolean,
	) {

		for (const item of Object.keys(CircleModes)) {
			const opt = document.createElement('option');
			opt.innerText = item;
			this.circleModeControlElm.appendChild(opt);

			if (item == this.mode) {
				opt.selected = true;
			}
		}

		this.circleModeControlElm.addEventListener('change', () => {
			this.setMode(this.circleModeControlElm.value as CircleModes);

			this.triggerChange('mode');
		});

		this.widthControl = makeInputControl('Shape', 'width', "number", this.width, () => {
			if (this.force) {
				this.heightControl.element.value = this.widthControl.element.value;
				this.height = parseInt(this.widthControl.element.value, 10);
			}
			this.width = parseInt(this.widthControl.element.value, 10);

			this.triggerChange('width');
		});

		this.heightControl = makeInputControl('Shape', 'height', "number", this.height, () => {
			if (this.force) {
				this.widthControl.element.value = this.heightControl.element.value;
				this.width = parseInt(this.heightControl.element.value, 10);
			}
			this.height = parseInt(this.heightControl.element.value, 10);

			this.triggerChange('height');
		});

		this.forceCircleControl = makeInputControl('Shape', 'Force Circle', "checkbox", "1", () => {
			// this.heightControl.element.value = this.widthControl.element.value;
			this.force = this.forceCircleControl.element.checked;

			// There's gotta be a cleaner way to do this, but this works for now avoiding recursive event calls
			this.height = this.width;
			this.heightControl.element.value = this.widthControl.element.value;

			this.triggerChange('force')
		});

		this.forceCircleControl.element.checked = this.force;
	}

	private triggerChange(event: string): void {
		this.changeEmitter.trigger({
			event,
			state: {
				mode: this.mode,
				width: this.width,
				height: this.height,
				force: this.force,
			}
		});
	}

	public getControls(): Control[] {
		return [
			this.forceCircleControl,
			this.widthControl,
			this.heightControl,
			{ element: this.circleModeControlElm, label: 'border', group: 'Render' },
		];
	}

	private setMode(mode: CircleModes): void {
		this.mode = mode;
	}

	public getBounds(): Bounds {
		return {
			minX: 0,
			maxX: this.width,

			minY: 0,
			maxY: this.height,
		};
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

	public getDescription(): string {
		return `Circle-${this.width}x${this.height}`;
	}

}
