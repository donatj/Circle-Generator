import { Control, ControlAwareInterface, ControlGroup, makeButtonControl, makeInputControl } from "../../Controls";
import { StateHandler, StateItem } from "../../State";
import { CLASS_BUILT, CLASS_FILLED, ATTR_X, ATTR_Y, ATTR_W, ATTR_H } from "./SvgConstants";
import { RenderOutput } from "../RendererInterface";

interface BuiltSquaresState {
	built: string[];
	width: number;
	height: number;
}

export class SvgHandler implements ControlAwareInterface, RenderOutput {

	private builtSquaresState: StateItem<BuiltSquaresState>;
	private builtSquares: Set<string> = new Set();

	private isDragging = false;
	private dragMode: 'add' | 'remove' = 'add';
	private processedDuringDrag: Set<string> = new Set();

	private svg: SVGElement;
	private scaleSize: number;

	constructor(
		svg: SVGElement,
		initialScale: number,
		stateHandler: StateHandler,
		descriptor: string,
	) {
		this.svg = svg;
		this.scaleSize = initialScale;
		this.builtSquaresState = stateHandler.get(`builtSquares-${descriptor}`, { built: [], width: 0, height: 0 });
		this.builtSquares = new Set(this.builtSquaresState.get('built'));
		this.attachEventListeners();
		this.applyBuiltSquaresToSvg();
	}

	public getSvgElement(): SVGElement {
		return this.svg;
	}

	public get node(): Node {
		return this.svg;
	}

	private applyBuiltSquaresToSvg(): void {
		// Apply the built state to all squares that should be built
		this.builtSquares.forEach(coordKey => {
			const [x, y] = coordKey.split(',').map(n => parseInt(n, 10));
			const element = this.svg.querySelector(`[${ATTR_X}="${x}"][${ATTR_Y}="${y}"]`) as HTMLElement;
			if (element && element.classList.contains(CLASS_FILLED)) {
				element.classList.add(CLASS_BUILT);
			}
		});
	}

	public setScale(scaleSize: number): void {
		const h = this.svg.getAttribute(ATTR_H);
		const w = this.svg.getAttribute(ATTR_W);
		if (!h || !w) {
			throw new Error("error getting requisite data attributes");
		}

		const wn = parseInt(w, 10);
		const hn = parseInt(h, 10);

		const aspect = hn / wn;

		let scale = scaleSize;
		scale = scale * (wn * .01);

		const scaleX = scale;
		const scaleY = scale * aspect;

		this.svg.setAttribute('width', scaleX + 'px');
		this.svg.setAttribute('height', scaleY + 'px');
		this.svg.style.width = scaleX + 'px';
		this.svg.style.height = scaleY + 'px';
	}

	public getControls(): Control[] {
		const scale = makeInputControl(ControlGroup.Render, 'scale', 'range', this.scaleSize, (val) => {
			this.scaleSize = parseInt(val, 10);
			this.setScale(this.scaleSize);
		}, { min: "100", max: "2000" });

		return [
			scale,
			makeButtonControl(ControlGroup.Tools, null, 'Clear Built', () => {
				this.clearBuiltSquares();
			}),
		];
	}

	private attachEventListeners(): void {
		this.svg.addEventListener('pointerdown', this.handlePointerDown);
		this.svg.addEventListener('pointermove', this.handlePointerMove);
		this.svg.addEventListener('pointerup', this.handlePointerUp);
		this.svg.addEventListener('pointercancel', this.handlePointerCancel);
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
		this.builtSquaresState.set('built', []);
		this.svg.querySelectorAll(`.${CLASS_BUILT}`).forEach(el => {
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
