import { GeneratorInterface2D } from "../../Generators/GeneratorInterface2D";
import { RendererInterface } from "../RendererInterface";
import { Control, ControlAwareInterface, ControlGroup, InfoControl, makeButtonControl, makeInputControl } from "../../Controls";
import { EventEmitter } from "../../EventEmitter";
import { xor } from "../../Math";
import { svgToCanvas, triggerDownload } from "../../Utils";
import { StateHandler } from "../../State";
import { SvgInteractionHandler } from "./SvgInteractionHandler";

interface SvgRendererState {
	scale: number;
	colorScheme: string;
}

interface ColorScheme {
	name: string;
	colors: {
		axisFilled: string;
		filled: string;
		axisLight: string;
		axisDark: string;
		grid: string;
		built: string;
	};
}

export class SvgRenderer implements RendererInterface, ControlAwareInterface {

	// CSS class names
	private static readonly CLASS_FILLED = 'filled';
	private static readonly CLASS_BUILT = 'built';

	private static readonly COLOR_SCHEMES: { [key: string]: ColorScheme } = {
		classic: {
			name: 'Classic',
			colors: {
				axisFilled: '#880000',
				filled: '#FF0000',
				axisLight: '#CCCCCC',
				axisDark: '#AAAAAA',
				grid: '#bbbbbb',
				built: '#7711AA',
			}
		},
		ocean: {
			name: 'Ocean',
			colors: {
				axisFilled: '#003366',
				filled: '#0066CC',
				axisLight: '#CCE5FF',
				axisDark: '#99CCFF',
				grid: '#B3D9FF',
				built: '#00CC99',
			}
		},
		forest: {
			name: 'Forest',
			colors: {
				axisFilled: '#1B4D1B',
				filled: '#2E7D32',
				axisLight: '#C8E6C9',
				axisDark: '#A5D6A7',
				grid: '#B9D8B9',
				built: '#FFA726',
			}
		},
		sunset: {
			name: 'Sunset',
			colors: {
				axisFilled: '#B71C1C',
				filled: '#FF5722',
				axisLight: '#FFE0B2',
				axisDark: '#FFCC80',
				grid: '#FFD699',
				built: '#9C27B0',
			}
		},
		monochrome: {
			name: 'Monochrome',
			colors: {
				axisFilled: '#000000',
				filled: '#404040',
				axisLight: '#F0F0F0',
				axisDark: '#D0D0D0',
				grid: '#C0C0C0',
				built: '#808080',
			}
		},
		sunny: {
			name: 'Sunny Day',
			colors: {
				axisFilled: '#0072B2',
				filled: '#56B4E9',
				axisLight: '#F0E442',
				axisDark: '#E69F00',
				grid: '#D0D0D0',
				built: '#D55E00',
			}
		},
	};

	// Data attributes
	private static readonly ATTR_X = 'data-x';
	private static readonly ATTR_Y = 'data-y';
	private static readonly ATTR_W = 'data-w';
	private static readonly ATTR_H = 'data-h';

	// SVG
	private static readonly SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	private static readonly SVG_ID = 'svg_circle';

	// Dimensions
	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	// Info controls
	private blocks = new InfoControl(ControlGroup.Details, "blocks");
	private stacksOf64 = new InfoControl(ControlGroup.Details, "stacks of 64");
	private stacksOf16 = new InfoControl(ControlGroup.Details, "stacks of 16");

	public readonly changeEmitter = new EventEmitter<SvgRendererState>();

	private cachedControls: Control[] | null = null;

	private interactionHandler: SvgInteractionHandler;

	private colorScheme: string;
	private svgRendererState: StateHandler;

	constructor(private scaleSize: number, stateHandler: StateHandler) {
		this.svgRendererState = stateHandler;
		this.interactionHandler = new SvgInteractionHandler(stateHandler);

		const state = stateHandler.get<SvgRendererState>('svgRenderer', {
			scale: scaleSize,
			colorScheme: 'classic'
		});
		this.colorScheme = state.get('colorScheme');
	}

	private getColors() {
		const scheme = SvgRenderer.COLOR_SCHEMES[this.colorScheme] || SvgRenderer.COLOR_SCHEMES.classic;
		return scheme.colors;
	}

	private triggerChange() {
		this.changeEmitter.trigger({
			scale: this.scaleSize,
			colorScheme: this.colorScheme,
		});
	}

	private createColorSchemeSelect(): HTMLSelectElement {
		const select = document.createElement('select');

		for (const key of Object.keys(SvgRenderer.COLOR_SCHEMES)) {
			const scheme = SvgRenderer.COLOR_SCHEMES[key];
			const opt = document.createElement('option');
			opt.value = key;
			opt.innerText = scheme.name;
			select.appendChild(opt);

			if (key === this.colorScheme) {
				opt.selected = true;
			}
		}

		select.addEventListener('change', () => {
			this.colorScheme = select.value;
			const state = this.svgRendererState.get<SvgRendererState>('svgRenderer', {
				scale: this.scaleSize,
				colorScheme: 'classic'
			});
			state.set('colorScheme', this.colorScheme);
			this.triggerChange();
		});

		return select;
	}

	public getControls(): Control[] {
		if (!this.cachedControls) {
			const scale = makeInputControl(ControlGroup.Render, 'scale', 'range', this.scaleSize, (val) => {
				this.scaleSize = parseInt(val, 10);
				this.scale();

				this.triggerChange();
			}, { min: "100", max: "2000" });

			const rendererControls: Control[] = [
				scale,

				makeButtonControl(ControlGroup.Download, null, 'PNG', async () => {
					if (!this.lastSvg) {
						throw new Error('No SVG to download');
					}

					const canvas = await svgToCanvas(this.lastSvg.outerHTML);
					const dataUrl = canvas.toDataURL();
					const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.png";

					triggerDownload(dataUrl, filename);
				}),

				makeButtonControl(ControlGroup.Download, null, 'SVG', async () => {
					if (!this.lastSvg) {
						throw new Error('No SVG to download');
					}

					const href = "data:image/svg+xml;base64," + btoa(this.lastSvg.outerHTML);
					const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.svg";

					triggerDownload(href, filename);
				}),
			];

			const colorSchemeControl: Control[] = [
				{ element: this.createColorSchemeSelect(), label: 'Color Scheme', group: ControlGroup.Render },
			];

			const interactionControls = this.interactionHandler.getControls();
			const infoControls: Control[] = [
				this.blocks,
				this.stacksOf64,
				this.stacksOf16,
			];

			this.cachedControls = rendererControls.concat(colorSchemeControl, interactionControls, infoControls);
		}
		return this.cachedControls;
	}


	private add(x: number, y: number, width: number, height: number, filled: boolean): string {
		const xp = (((x + 1) * this.dFull) /*+ (this._svg_width / 2)*/ - (this.dFull / 2)) + .5;
		const yp = (((y + 1) * this.dFull) /*+ (this._svg_height / 2)*/ - (this.dFull / 2)) + .5;

		let color: string | null = null;

		const midx = (width / 2) - .5;
		const midy = (height / 2) - .5;

		const colors = this.getColors();

		if (filled) {
			if (x == midx || y == midy) {
				color = colors.axisFilled;
			} else {
				color = colors.filled;
			}
		} else if (x == midx || y == midy) {
			if (xor(!!(x & 1), !!(y & 1))) {
				color = colors.axisDark;
			} else {
				color = colors.axisLight;
			}
		}

		if (color) {
			const classes = [SvgRenderer.CLASS_FILLED];
			if (filled && this.interactionHandler.isSquareBuilt(x, y)) {
				classes.push(SvgRenderer.CLASS_BUILT);
			}
			const classStr = filled ? classes.join(' ') : '';
			return `<rect x="${xp}" y="${yp}" fill="${color}" width="${this.dWidth}" height="${this.dWidth}" class="${classStr}" ${SvgRenderer.ATTR_X}="${x}" ${SvgRenderer.ATTR_Y}="${y}" />`;
		}

		return '';
	}

	private lastSvg: SVGElement | null = null;

	public render(target: HTMLElement, generator: GeneratorInterface2D): void {
		const svg = this.generateSVG(generator);

		target.innerHTML = svg;

		this.lastSvg = target.querySelector('svg');

		if (this.lastSvg) {
			this.interactionHandler.attachToSvg(this.lastSvg);
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
		this.interactionHandler.clearBuiltSquaresIfDimensionsChanged(width, height);

		const svgWidth = this.dFull * (width + 1);
		const svgHeight = this.dFull * (height + 1);
		const half = this.dWidth / 2;
		const centerX = width / 2;
		const centerY = height / 2;

		const parts: string[] = [];
		const colors = this.getColors();

		parts.push(`<svg id="${SvgRenderer.SVG_ID}"
			xmlns="${SvgRenderer.SVG_NAMESPACE}"
			${SvgRenderer.ATTR_W}="${svgWidth}" ${SvgRenderer.ATTR_H}="${svgHeight}"
			width="${svgWidth}px" height="${svgHeight}px"
			viewBox="0 0 ${svgWidth} ${svgHeight}">
			<style>
				.${SvgRenderer.CLASS_FILLED} {
					cursor: pointer;
					transition: fill 0.3s;
				}

				.${SvgRenderer.CLASS_FILLED}:hover {
					fill: ${colors.built};
				}

				.${SvgRenderer.CLASS_FILLED}.${SvgRenderer.CLASS_BUILT} {
					fill: ${colors.built};
				}

				.${SvgRenderer.CLASS_FILLED}.${SvgRenderer.CLASS_BUILT}:hover {
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
		const colors = this.getColors();
		for (let i = 0; i <= count; i++) {
			const atCenter = i === center;
			const fill = atCenter ? colors.axisFilled : colors.grid;
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
			throw new Error(`Error finding ${SvgRenderer.SVG_ID}`);
		}
		const h = this.lastSvg.getAttribute(SvgRenderer.ATTR_H);
		const w = this.lastSvg.getAttribute(SvgRenderer.ATTR_W);
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
