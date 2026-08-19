import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeInputControl, Control } from "../Controls";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { NeverError } from "../Errors";

export enum CircleModes {
	thick = 'thick',
	thin = 'thin',
	filled = 'filled',
}

export const DEFAULT_CIRCLE_DIMENSION = 13;

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

export function isCircleFilled(
	x: number,
	y: number,
	width: number,
	height: number,
	mode: CircleModes
): boolean {
	if (!areValidDimensions(width, height)) {
		return false;
	}

	x = -.5 * (width - 2 * (x + .5));
	y = -.5 * (height - 2 * (y + .5));

	switch (mode) {
		case CircleModes.thick: {
			return fatfilled(x, y, width / 2, width / height);
		}
		case CircleModes.thin: {
			return thinfilled(x, y, width / 2, width / height);
		}
		case CircleModes.filled: {
			return filled(x, y, width / 2, width / height);
		}
		default: {
			throw new NeverError(mode);
		}
	}
}

function isCircleMode(value: unknown): value is CircleModes {
	return Object.values(CircleModes).includes(value as CircleModes);
}

function isValidDimension(value: number): boolean {
	return Number.isSafeInteger(value) && value > 0;
}

function areValidDimensions(width: number, height: number): boolean {
	return isValidDimension(width) && isValidDimension(height);
}

function parseDimension(value: string): number | null {
	const parsed = Number(value);
	return isValidDimension(parsed) ? parsed : null;
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
		if (!areValidDimensions(this.width, this.height)) {
			this.width = DEFAULT_CIRCLE_DIMENSION;
			this.height = DEFAULT_CIRCLE_DIMENSION;
		}

		if (!isCircleMode(this.mode)) {
			this.mode = CircleModes.thick;
		}

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
			const updatedWidth = parseDimension(this.widthControl.element.value);
			if (updatedWidth === null) {
				this.syncDimensionControls();
				return;
			}

			this.updateDimensions(updatedWidth, this.force ? updatedWidth : this.height, 'width');
		}, { min: '1', step: '1' });

		this.heightControl = makeInputControl('Shape', 'height', "number", this.height, () => {
			const updatedHeight = parseDimension(this.heightControl.element.value);
			if (updatedHeight === null) {
				this.syncDimensionControls();
				return;
			}

			this.updateDimensions(this.force ? updatedHeight : this.width, updatedHeight, 'height');
		}, { min: '1', step: '1' });

		this.forceCircleControl = makeInputControl('Shape', 'Force Circle', "checkbox", "1", () => {
			this.force = this.forceCircleControl.element.checked;

			if (this.force && !areValidDimensions(this.width, this.width)) {
				this.force = false;
				this.forceCircleControl.element.checked = false;
				return;
			}

			if (this.force) {
				this.height = this.width;
				this.syncDimensionControls();
			}

			this.triggerChange('force');
		});

		this.forceCircleControl.element.checked = this.force;
	}

	private syncDimensionControls(): void {
		this.widthControl.element.value = `${this.width}`;
		this.heightControl.element.value = `${this.height}`;
	}

	private updateDimensions(width: number, height: number, event: string): void {
		if (!areValidDimensions(width, height)) {
			this.syncDimensionControls();
			return;
		}

		this.width = width;
		this.height = height;
		this.syncDimensionControls();
		this.triggerChange(event);
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
		return isCircleFilled(x, y, this.width, this.height, this.mode);
	}

	public getDescription(): string {
		return `Circle-${this.width}x${this.height}`;
	}

}
