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
    closestCorner = 'closest corner',
    furthestCorner = 'furthest corner',
}

export enum CircleCenterModes {
    infer = 'infer',
    even = 'even',
    odd = 'odd',
}

function filled(x: number, y: number, radius: number, ratio: number, mode: FillCheckModes): boolean {
	let checkX;
    let checkY;
    switch (mode) {
        case FillCheckModes.center:
            checkX = x;
            checkY = y;
            break;
        case FillCheckModes.closestCorner:
            checkX = (x >= 0) ? x - 0.5 : x + 0.5;
            checkY = (y >= 0) ? y - 0.5 : y + 0.5;
            break;
        case FillCheckModes.furthestCorner:
            checkX = (x >= 0) ? x + 0.5 : x - 0.5;
            checkY = (y >= 0) ? y + 0.5 : y - 0.5;
            break;
        default: {
            throw new NeverError(mode);
        }
    }
    return distance(checkX, checkY, ratio) <= radius * 0.999999999999;
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
    circleCenterMode: CircleCenterModes;
}

export class Circle implements GeneratorInterface2D, ControlAwareInterface {

	private circleModeControlElm: HTMLSelectElement;
    private fillCheckModeControlElm: HTMLSelectElement;
    private circleCenterModeControlElm: HTMLSelectElement;

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
        private circleCenterMode: CircleCenterModes,
	) {

        this.circleModeControlElm = makeModeControl(
            CircleModes,
            this.circleMode,
            () => {
                this.setCircleMode(this.circleModeControlElm.value as CircleModes);
                this.triggerChange('circleMode');
            },
        );

        this.fillCheckModeControlElm = makeModeControl(
            FillCheckModes,
            this.fillCheckMode,
            () => {
                this.setFillCheckMode(this.fillCheckModeControlElm.value as FillCheckModes);
                this.triggerChange('fillCheckMode');
            },
        );

		this.widthControl = makeInputControl('Shape', 'width', "number", this.width, () => {
			if (this.force) {
				this.heightControl.element.value = this.widthControl.element.value;
				this.height = parseFloat(this.widthControl.element.value);
			}
			this.width = parseFloat(this.widthControl.element.value);
            console.log("width: ", this.width);

			this.triggerChange('width');
		});

		this.heightControl = makeInputControl('Shape', 'height', "number", this.height, () => {
			if (this.force) {
				this.widthControl.element.value = this.heightControl.element.value;
				this.width = parseFloat(this.heightControl.element.value);
			}
			this.height = parseFloat(this.heightControl.element.value);
            console.log("height: ", this.height);

			this.triggerChange('height');
		});

        this.circleCenterModeControlElm = makeModeControl(
            CircleCenterModes,
            this.circleCenterMode,
            () => {
                this.setCircleCenterMode(this.circleCenterModeControlElm.value as CircleCenterModes);
                this.triggerChange('circleCenterMode');
            },
        );

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
                circleCenterMode: this.circleCenterMode,
			}
		});
	}

	public getControls(): Control[] {
		return [
			this.forceCircleControl,
            { element: this.circleCenterModeControlElm, label: 'center (even/odd)', group: 'Shape' },
			this.widthControl,
			this.heightControl,
			{ element: this.circleModeControlElm, label: 'border', group: 'Render' },
            { element: this.fillCheckModeControlElm, label: 'fill check', group: 'Render' },
		];
	}

	private setCircleMode(circleMode: CircleModes): void {
		this.circleMode = circleMode;
	}

    private setFillCheckMode(fillCheckMode: FillCheckModes): void {
		this.fillCheckMode = fillCheckMode;
	}

    private setCircleCenterMode(circleCenterMode: CircleCenterModes): void {
        this.circleCenterMode = circleCenterMode;
    }

	public getBounds(): Bounds {

        const ceilWidth = Math.ceil(this.width);
        const ceilHeight = Math.ceil(this.height);

        let maxX;
        let maxY;

        switch (this.circleCenterMode) {
            case CircleCenterModes.infer:
                maxX = ceilWidth;
                maxY = ceilHeight;
                break;
            case CircleCenterModes.even:
                maxX = (ceilWidth % 2 == 0) ? ceilWidth : ceilWidth + 1;
                maxY = (ceilHeight % 2 == 0) ? ceilHeight : ceilHeight + 1;
                break;
            case CircleCenterModes.odd:
                maxX = (ceilWidth % 2 == 1) ? ceilWidth : ceilWidth + 1;
                maxY = (ceilHeight % 2 == 1) ? ceilHeight : ceilHeight + 1;
                break;
            default: {
                throw new NeverError(this.circleCenterMode);
            }
        }

		return {
			minX: 0,
			maxX: maxX,

			minY: 0,
			maxY: maxY,
		};
	}

	public isFilled(x: number, y: number): boolean {
		const bounds = this.getBounds();

		x = -.5 * (bounds.maxX - 2 * (x + .5));
		y = -.5 * (bounds.maxY - 2 * (y + .5));

		switch (this.circleMode) {
			case CircleModes.thick: {
				return fatfilled(x, y, this.width / 2, this.width / this.height, this.fillCheckMode);
			}
			case CircleModes.thin: {
				return thinfilled(x, y, this.width / 2, this.width / this.height, this.fillCheckMode);
			}
			case CircleModes.filled: {
				return filled(x, y, this.width / 2, this.width / this.height, this.fillCheckMode);
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
