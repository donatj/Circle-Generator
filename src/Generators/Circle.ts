import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, ControlGroup, makeInputControl, Control } from "../Controls";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { NeverError } from "../Errors";

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

	public readonly changeEmitter = new EventEmitter<{ event: string, state: CircleState }>();

	private widthControl: Control<HTMLInputElement>;
	private heightControl: Control<HTMLInputElement>;
	private forceCircleControl: Control<HTMLInputElement>;
	private cachedControls: Control[] | null = null;

	constructor(
		private width: number,
		private height: number,
		private mode : CircleModes,
		private force : boolean,
	) {

		this.widthControl = makeInputControl(ControlGroup.Shape, 'width', "number", this.width, () => {
			if (this.force) {
				this.heightControl.element.value = this.widthControl.element.value;
				this.height = parseInt(this.widthControl.element.value, 10);
			}
			this.width = parseInt(this.widthControl.element.value, 10);

			this.triggerChange('width');
		});

		this.heightControl = makeInputControl(ControlGroup.Shape, 'height', "number", this.height, () => {
			if (this.force) {
				this.widthControl.element.value = this.heightControl.element.value;
				this.width = parseInt(this.heightControl.element.value, 10);
			}
			this.height = parseInt(this.heightControl.element.value, 10);

			this.triggerChange('height');
		});

		this.forceCircleControl = makeInputControl(ControlGroup.Shape, 'Force Circle', "checkbox", "1", () => {
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

	private createModeSelectElement(): HTMLSelectElement {
		const select = document.createElement('select');

		for (const item of Object.keys(CircleModes)) {
			const opt = document.createElement('option');
			opt.innerText = item;
			select.appendChild(opt);

			if (item == this.mode) {
				opt.selected = true;
			}
		}

		select.addEventListener('change', () => {
			this.setMode(select.value as CircleModes);
			this.triggerChange('mode');
		});

		return select;
	}

	public getControls(): Control[] {
		if (!this.cachedControls) {
			this.cachedControls = [
				this.forceCircleControl,
				this.widthControl,
				this.heightControl,
				{ element: this.createModeSelectElement(), label: 'border', group: ControlGroup.Render },
			];
		}
		return this.cachedControls;
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
			case CircleModes.filled: {
				return filled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY);
			}
			default: {
				throw new NeverError(this.mode);
			}
		}
	}

	public getDescription(): string {
		return `Circle-${this.width}x${this.height}-${this.mode}`;
	}

}
