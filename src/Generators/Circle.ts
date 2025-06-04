import { GeneratorInterface2D, Bounds } from "./GeneratorInterface2D";
import { ControlAwareInterface, makeModeControl, makeInputControl, Control } from "../Controller";
import { distance } from "../Math";
import { EventEmitter } from "../EventEmitter";
import { NeverError } from "../Errors";

export enum CircleModes {
	thick = 'thick',
	thin = 'thin',
	filled = 'filled',
}

export enum FillCheckModes {
    center = 'center',
    closest = 'closest',
    furthest = 'furthest',
}

function filled(x: number, y: number, radius: number, ratio: number, mode: FillCheckModes): boolean {
	let checkX;
    let checkY;
    switch (mode) {
        case FillCheckModes.center:
            checkX = x;
            checkY = y;
            break;
        case FillCheckModes.closest:
            checkX = (x >= 0) ? x - 0.5 : x + 0.5;
            checkY = (y >= 0) ? y - 0.5 : y + 0.5;
            break;
        case FillCheckModes.furthest:
            checkX = (x >= 0) ? x + 0.5 : x - 0.5;
            checkY = (y >= 0) ? y + 0.5 : y - 0.5;
            break;
        default: {
            throw new NeverError(mode);
        }
    }
    return distance(x, y, ratio) <= radius;
}

function fatfilled(x: number, y: number, radius: number, ratio: number, mode: FillCheckModes): boolean {
	return filled(x, y, radius, ratio, mode) && !(
		filled(x + 1, y, radius, ratio, mode) &&
		filled(x - 1, y, radius, ratio, mode) &&
		filled(x, y + 1, radius, ratio, mode) &&
		filled(x, y - 1, radius, ratio, mode) &&
		filled(x + 1, y + 1, radius, ratio, mode) &&
		filled(x + 1, y - 1, radius, ratio, mode) &&
		filled(x - 1, y - 1, radius, ratio, mode) &&
		filled(x - 1, y + 1, radius, ratio, mode)
	);
}

function thinfilled(x: number, y: number, radius: number, ratio: number, mode: FillCheckModes): boolean {
	return filled(x, y, radius, ratio, mode) && !(
		filled(x + 1, y, radius, ratio, mode) &&
		filled(x - 1, y, radius, ratio, mode) &&
		filled(x, y + 1, radius, ratio, mode) &&
		filled(x, y - 1, radius, ratio, mode)
	);
}

interface CircleState {
	circleMode: CircleModes;
    fillCheckMode: FillCheckModes;
	width: number;
	height: number;
	force: boolean;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm: HTMLSelectElement;
    private fillCheckModeControlElm: HTMLSelectElement;

	public readonly changeEmitter = new EventEmitter<{ event: string, state: CircleState }>();

	private widthControl: Control<HTMLInputElement>;
	private heightControl: Control<HTMLInputElement>;
	private forceCircleControl: Control<HTMLInputElement>;

	constructor(
		private width: number,
		private height: number,
		private circleMode : CircleModes,
        private fillCheckMode: FillCheckModes,
		private force : boolean,
	) {

        this.circleModeControlElm = makeModeControl(CircleModes, this.circleMode, () => {
            this.setCircleMode(this.circleModeControlElm.value as CircleModes);

			this.triggerChange('circleMode');
        });

        this.fillCheckModeControlElm = makeModeControl(FillCheckModes, this.fillCheckMode, () => {
            this.setFillCheckMode(this.fillCheckModeControlElm.value as FillCheckModes);

			this.triggerChange('fillCheckMode');
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
				circleMode: this.circleMode,
                fillCheckMode: this.fillCheckMode,
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

	private setCircleMode(circleMode: CircleModes): void {
		this.circleMode = circleMode;
	}

    private setFillCheckMode(fillCheckMode: FillCheckModes): void {
		this.fillCheckMode = fillCheckMode;
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

		switch (this.circleMode) {
			case CircleModes.thick: {
				return fatfilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY, this.fillCheckMode);
			}
			case CircleModes.thin: {
				return thinfilled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY, this.fillCheckMode);
			}
			case CircleModes.filled: {
				return filled(x, y, (bounds.maxX / 2), bounds.maxX / bounds.maxY, this.fillCheckMode);
			}
			default: {
				throw new NeverError(this.circleMode);
			}
		}
	}

	public getDescription(): string {
		return `Circle-${this.width}x${this.height}`;
	}

}
