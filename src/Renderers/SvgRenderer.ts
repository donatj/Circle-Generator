import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";
import { RendererInterface } from "./RendererInterface";
import { Control, ControlAwareInterface, InfoControl, makeButtonControl, makeInputControl } from "../Controls";
import { EventEmitter } from "../EventEmitter";
import { xor } from "../Math";
import { svgToCanvas, triggerDownload } from "../Utils";
import { StateHandler, StateItem } from "../State";

interface SvgRendererState {
	scale: number;
}

interface BuiltSquaresState {
	built: string[];
	width: number;
	height: number;
}

export class SvgRenderer implements RendererInterface, ControlAwareInterface {

	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	private blocks = new InfoControl("Details", "blocks");

	private stacksOf64 = new InfoControl("Details", "stacks of 64");
	private stacksOf16 = new InfoControl("Details", "stacks of 16");

	public readonly changeEmitter = new EventEmitter<SvgRendererState>();

	private cachedControls: Control[] | null = null;

	private builtSquaresState: StateItem<BuiltSquaresState>;
	private builtSquares: Set<string> = new Set();

	constructor(private scaleSize: number, stateHandler: StateHandler) {
		this.builtSquaresState = stateHandler.get("builtSquares", { built: [], width: 0, height: 0 });
		this.builtSquares = new Set(this.builtSquaresState.get('built'));
	}

	private triggerChange() {
		this.changeEmitter.trigger({
			scale: this.scaleSize,
		});
	}

	public getControls(): Control[] {
		if (!this.cachedControls) {
			const scale = makeInputControl('Render', 'scale', 'range', this.scaleSize, (val) => {
				this.scaleSize = parseInt(val, 10);
				this.scale();

				this.triggerChange();
			}, { min: "100", max: "2000" });

			this.cachedControls = [
				scale,

				makeButtonControl('Download', null, 'PNG', async () => {
					if (!this.lastSvg) {
						throw new Error('No SVG to download');
					}

					const canvas = await svgToCanvas(this.lastSvg.outerHTML);
					const dataUrl = canvas.toDataURL();
					const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.png";

					triggerDownload(dataUrl, filename);
				}),

				makeButtonControl('Download', null, 'SVG', async () => {
					if (!this.lastSvg) {
						throw new Error('No SVG to download');
					}

					const href = "data:image/svg+xml;base64," + btoa(this.lastSvg.outerHTML);
					const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.svg";

					triggerDownload(href, filename);
				}),

				makeButtonControl('Tools', null, 'Clear Built', () => {
					this.clearBuiltSquares();
					this.builtSquaresState.set('built', []);
				}),

				this.blocks,
				this.stacksOf64,
				this.stacksOf16,
			];
		}
		return this.cachedControls;
	}


	private coordToKey(x: number, y: number): string {
		return `${x},${y}`;
	}

	private clearBuiltSquares(): void {
		this.builtSquares.clear();
		if (this.lastSvg) {
			this.lastSvg.querySelectorAll('.built').forEach(el => {
				el.classList.remove('built');
			});
		}
	}

	private add(x: number, y: number, width: number, height: number, filled: boolean): string {
		const xp = (((x + 1) * this.dFull) /*+ (this._svg_width / 2)*/ - (this.dFull / 2)) + .5;
		const yp = (((y + 1) * this.dFull) /*+ (this._svg_height / 2)*/ - (this.dFull / 2)) + .5;

		let color: string | null = null;

		const midx = (width / 2) - .5;
		const midy = (height / 2) - .5;

		if (filled) {
			if (x == midx || y == midy) {
				color = '#880000';
			} else {
				color = '#FF0000';
			}
		} else if (x == midx || y == midy) {
			if (xor(!!(x & 1), !!(y & 1))) {
				color = '#AAAAAA';
			} else {
				color = '#CCCCCC';
			}
		}

		if (color) {
			const classes = ['filled'];
			const coordKey = this.coordToKey(x, y);
			if (filled && this.builtSquares.has(coordKey)) {
				classes.push('built');
			}
			const classStr = filled ? classes.join(' ') : '';
			return `<rect x="${xp}" y="${yp}" fill="${color}" width="${this.dWidth}" height="${this.dWidth}" class="${classStr}" data-x="${x}" data-y="${y}" />`;
		}

		return '';
	}

	private lastSvg: SVGElement | null = null;

	public render(target: HTMLElement, generator: GeneratorInterface2D): void {
		const svg = this.generateSVG(generator);

		target.innerHTML = svg;

		this.lastSvg = target.querySelector('svg');

		if (this.lastSvg) {
			this.lastSvg.addEventListener('click', (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (target.classList.contains('filled')) {
					const x = target.getAttribute('data-x');
					const y = target.getAttribute('data-y');

					if (x !== null && y !== null) {
						const coordKey = this.coordToKey(parseInt(x, 10), parseInt(y, 10));

						if (this.builtSquares.has(coordKey)) {
							this.builtSquares.delete(coordKey);
						} else {
							this.builtSquares.add(coordKey);
						}

						this.builtSquaresState.set('built', Array.from(this.builtSquares));
						target.classList.toggle('built');
					}
				}
			});
		}

		this.scale();
	}

	private lastGenerator: GeneratorInterface2D | null = null;

	private generateSVG(generator: GeneratorInterface2D): string {
		this.lastGenerator = generator;
		const { minX, maxX, minY, maxY } = generator.getBounds();
		const width = maxX - minX;
		const height = maxY - minY;

		// Clear built squares if dimensions changed
		const storedWidth = this.builtSquaresState.get('width');
		const storedHeight = this.builtSquaresState.get('height');
		if (storedWidth !== width || storedHeight !== height) {
			this.clearBuiltSquares();
			this.builtSquaresState.set('width', width);
			this.builtSquaresState.set('height', height);
			this.builtSquaresState.set('built', []);
		}

		const svgWidth = this.dFull * (width + 1);
		const svgHeight = this.dFull * (height + 1);
		const half = this.dWidth / 2;
		const centerX = width / 2;
		const centerY = height / 2;

		const parts: string[] = [];

		parts.push(`<svg id="svg_circle"
			xmlns="http://www.w3.org/2000/svg"
			data-w="${svgWidth}" data-h="${svgHeight}"
			width="${svgWidth}px" height="${svgHeight}px"
			viewBox="0 0 ${svgWidth} ${svgHeight}">
			<style>
				.filled {
					cursor: pointer;
					transition: fill 0.3s;
				}

				.filled:hover {
					fill: #7711AA;
				}

				.filled.built {
					fill: #7711AA;
				}

				.filled.built:hover {
					fill: inherit;
				}
			</style>
		`);

		let fillCount = 0;
		for (let y = minY; y < maxY; y++) {
			for (let x = minX; x < maxX; x++) {
				const filled = generator.isFilled(x, y);
				const rect = this.add(x, y, width, height, filled);
				if (rect) {
					parts.push(rect);
				}
				if (filled) fillCount++;
			}
		}

		this.blocks.setValue(`${fillCount}`);
		this.stacksOf64.setValue(`${(fillCount / 64).toFixed(1)}`);
		this.stacksOf16.setValue(`${(fillCount / 16).toFixed(1)}`);

		// vertical grid lines
		parts.push(this.renderGridLines(width, svgHeight, half, centerX, true));
		// horizontal grid lines
		parts.push(this.renderGridLines(height, svgWidth, half, centerY, false));

		parts.push(`</svg>`);
		return parts.join('');
	}

	private renderGridLines(
		count: number,
		length: number,
		offset: number,
		center: number,
		vertical: boolean
	): string {
		const lines: string[] = [];
		for (let i = 0; i <= count; i++) {
			const atCenter = i === center;
			const fill = atCenter ? '#880000' : '#bbbbbb';
			const opacity = atCenter ? '1' : '.3';
			if (vertical) {
				lines.push(`<rect x="${i * this.dFull + offset}" y="0" fill="${fill}"
						 width="${this.dBorder}" height="${length}" opacity="${opacity}" />`);
			} else {
				lines.push(`<rect x="0" y="${i * this.dFull + offset}" fill="${fill}"
						 width="${length}" height="${this.dBorder}" opacity="${opacity}" />`);
			}
		}
		return lines.join('');
	}


	private scale() {
		if (!this.lastSvg) {
			throw new Error("Error finding svg_circle");
		}
		const h = this.lastSvg.getAttribute('data-h');
		const w = this.lastSvg.getAttribute('data-w');
		if (!h || !w) {
			throw new Error("error getting requisite data attributes");
		}

		const wn = parseInt(w, 10);
		const hn = parseInt(h, 10);

		const aspect = hn / wn;

		let scale = this.scaleSize;
		scale = scale * (wn * .01);

		const scaleX = scale;
		const scaleY = scale * aspect;

		this.lastSvg.setAttribute('width', scaleX + 'px');
		this.lastSvg.setAttribute('height', scaleY + 'px');
		this.lastSvg.style.width = scaleX + 'px';
		this.lastSvg.style.height = scaleY + 'px';
	}
}
