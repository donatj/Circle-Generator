import { Control, ControlAwareInterface, ControlGroup, makeButtonControl } from "../../Controls";
import { StateHandler, StateItem } from "../../State";
import { CLASS_BUILT, CLASS_FILLED, ATTR_X, ATTR_Y } from "./SvgConstants";

interface BuiltSquaresState {
	built: string[];
	width: number;
	height: number;
}

export class SvgInteractionHandler implements ControlAwareInterface {

	private builtSquaresState: StateItem<BuiltSquaresState>;
	private builtSquares: Set<string> = new Set();

	private isDragging = false;
	private dragMode: 'add' | 'remove' = 'add';
	private processedDuringDrag: Set<string> = new Set();

	private cachedControls: Control[] | null = null;

	constructor(stateHandler: StateHandler) {
		this.builtSquaresState = stateHandler.get("builtSquares", { built: [], width: 0, height: 0 });
		this.builtSquares = new Set(this.builtSquaresState.get('built'));
	}

	public getControls(): Control[] {
		if (!this.cachedControls) {
			this.cachedControls = [
				makeButtonControl(ControlGroup.Tools, null, 'Clear Built', () => {
					this.clearBuiltSquares();
					this.builtSquaresState.set('built', []);
				}),
			];
		}
		return this.cachedControls;
	}

	public attachToSvg(svg: SVGElement): void {
		svg.addEventListener('pointerdown', this.handlePointerDown);
		svg.addEventListener('pointermove', this.handlePointerMove);
		svg.addEventListener('pointerup', this.handlePointerUp);
		svg.addEventListener('pointercancel', this.handlePointerCancel);
	}

	public detachFromSvg(svg: SVGElement): void {
		svg.removeEventListener('pointerdown', this.handlePointerDown);
		svg.removeEventListener('pointermove', this.handlePointerMove);
		svg.removeEventListener('pointerup', this.handlePointerUp);
		svg.removeEventListener('pointercancel', this.handlePointerCancel);
	}

	public clearBuiltSquaresIfDimensionsChanged(width: number, height: number): void {
		const storedWidth = this.builtSquaresState.get('width');
		const storedHeight = this.builtSquaresState.get('height');
		if (storedWidth !== width || storedHeight !== height) {
			this.clearBuiltSquares();
			this.builtSquaresState.set('width', width);
			this.builtSquaresState.set('height', height);
			this.builtSquaresState.set('built', []);
		}
	}

	public isSquareBuilt(x: number, y: number): boolean {
		return this.builtSquares.has(this.coordToKey(x, y));
	}

	private coordToKey(x: number, y: number): string {
		return `${x},${y}`;
	}

	private getCoordFromElement(element: HTMLElement): { x: number; y: number } | null {
		const xAttr = element.getAttribute(ATTR_X);
		const yAttr = element.getAttribute(ATTR_Y);

		if (xAttr === null || yAttr === null) {
			return null;
		}

		return {
			x: parseInt(xAttr, 10),
			y: parseInt(yAttr, 10)
		};
	}

	private clearBuiltSquares(): void {
		this.builtSquares.clear();
		document.querySelectorAll(`.${CLASS_BUILT}`).forEach(el => {
			el.classList.remove(CLASS_BUILT);
		});
	}

	private toggleSquare(element: HTMLElement, coordKey: string, forceMode?: 'add' | 'remove'): void {
		const mode = forceMode || (this.builtSquares.has(coordKey) ? 'remove' : 'add');

		if (mode === 'add') {
			this.builtSquares.add(coordKey);
			element.classList.add(CLASS_BUILT);
		} else {
			this.builtSquares.delete(coordKey);
			element.classList.remove(CLASS_BUILT);
		}

		this.builtSquaresState.set('built', Array.from(this.builtSquares));
	}

	private handlePointerDown = (e: PointerEvent): void => {
		const element = e.target as HTMLElement;
		if (element.classList.contains(CLASS_FILLED)) {
			e.preventDefault();
			this.isDragging = true;
			this.processedDuringDrag.clear();

			const coord = this.getCoordFromElement(element);
			if (coord) {
				const coordKey = this.coordToKey(coord.x, coord.y);

				// Determine mode based on first square
				this.dragMode = this.builtSquares.has(coordKey) ? 'remove' : 'add';

				this.toggleSquare(element, coordKey, this.dragMode);
				this.processedDuringDrag.add(coordKey);
			}

			const svg = e.currentTarget as SVGElement;
			if (svg) {
				svg.setPointerCapture(e.pointerId);
			}
		}
	};

	private handlePointerMove = (e: PointerEvent): void => {
		if (!this.isDragging) return;

		const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
		if (element && element.classList.contains(CLASS_FILLED)) {
			const coord = this.getCoordFromElement(element);
			if (coord) {
				const coordKey = this.coordToKey(coord.x, coord.y);

				// Only process each square once per drag
				if (!this.processedDuringDrag.has(coordKey)) {
					this.toggleSquare(element, coordKey, this.dragMode);
					this.processedDuringDrag.add(coordKey);
				}
			}
		}
	};

	private handlePointerUp = (e: PointerEvent): void => {
		if (this.isDragging) {
			this.isDragging = false;
			this.processedDuringDrag.clear();
			const svg = e.currentTarget as SVGElement;
			if (svg) {
				svg.releasePointerCapture(e.pointerId);
			}
		}
	};

	private handlePointerCancel = (): void => {
		this.isDragging = false;
		this.processedDuringDrag.clear();
	};

}
