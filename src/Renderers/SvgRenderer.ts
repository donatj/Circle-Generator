import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";
import { RendererInterface } from "./RendererInterface";
import { Control, ControlAwareInterface, InfoControl, makeButtonControl, makeInputControl } from "../Controls";
import { EventEmitter } from "../EventEmitter";
import { xor } from "../Math";
import { svgToCanvas, triggerDownload } from "../Utils";
import { StateHandler } from "../State";
import { SvgInteractionHandler } from "./SvgInteractionHandler";

interface SvgRendererState {
	scale: number;
}

export class SvgRenderer implements RendererInterface, ControlAwareInterface {

	// CSS class names
	private static readonly CLASS_FILLED = 'filled';
	private static readonly CLASS_BUILT = 'built';

	// Data attributes
	private static readonly ATTR_X = 'data-x';
	private static readonly ATTR_Y = 'data-y';
	private static readonly ATTR_W = 'data-w';
	private static readonly ATTR_H = 'data-h';

	// Colors
	private static readonly COLOR_AXIS_FILLED = '#880000';
	private static readonly COLOR_FILLED = '#FF0000';
	private static readonly COLOR_AXIS_LIGHT = '#CCCCCC';
	private static readonly COLOR_AXIS_DARK = '#AAAAAA';
	private static readonly COLOR_GRID = '#bbbbbb';
	private static readonly COLOR_BUILT = '#7711AA';

	// SVG
	private static readonly SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	private static readonly SVG_ID = 'svg_circle';

	// Control groups
	private static readonly GROUP_RENDER = 'Render';
	private static readonly GROUP_DOWNLOAD = 'Download';
	private static readonly GROUP_DETAILS = 'Details';

	// Dimensions
	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	// Info controls
	private blocks = new InfoControl(SvgRenderer.GROUP_DETAILS, "blocks");
	private stacksOf64 = new InfoControl(SvgRenderer.GROUP_DETAILS, "stacks of 64");
	private stacksOf16 = new InfoControl(SvgRenderer.GROUP_DETAILS, "stacks of 16");

	public readonly changeEmitter = new EventEmitter<SvgRendererState>();

	private cachedControls: Control[] | null = null;

	private interactionHandler: SvgInteractionHandler;

	constructor(private scaleSize: number, stateHandler: StateHandler) {
		this.interactionHandler = new SvgInteractionHandler(stateHandler);
	}

	private triggerChange() {
		this.changeEmitter.trigger({
			scale: this.scaleSize,
		});
	}

	public getControls(): Control[] {
		if (!this.cachedControls) {
			const scale = makeInputControl(SvgRenderer.GROUP_RENDER, 'scale', 'range', this.scaleSize, (val) => {
				this.scaleSize = parseInt(val, 10);
				this.scale();

				this.triggerChange();
			}, { min: "100", max: "2000" });

			const rendererControls: Control[] = [
				scale,

				makeButtonControl(SvgRenderer.GROUP_DOWNLOAD, null, 'PNG', async () => {
					if (!this.lastSvg) {
						throw new Error('No SVG to download');
					}

					const canvas = await svgToCanvas(this.lastSvg.outerHTML);
					const dataUrl = canvas.toDataURL();
					const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.png";

					triggerDownload(dataUrl, filename);
				}),

				makeButtonControl(SvgRenderer.GROUP_DOWNLOAD, null, 'SVG', async () => {
					if (!this.lastSvg) {
						throw new Error('No SVG to download');
					}

					const href = "data:image/svg+xml;base64," + btoa(this.lastSvg.outerHTML);
					const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.svg";

					triggerDownload(href, filename);
				}),
			];

			const interactionControls = this.interactionHandler.getControls();
			const infoControls: Control[] = [
				this.blocks,
				this.stacksOf64,
				this.stacksOf16,
			];

			this.cachedControls = rendererControls.concat(interactionControls, infoControls);
		}
		return this.cachedControls;
	}


	private add(x: number, y: number, width: number, height: number, filled: boolean): string {
		const xp = (((x + 1) * this.dFull) /*+ (this._svg_width / 2)*/ - (this.dFull / 2)) + .5;
		const yp = (((y + 1) * this.dFull) /*+ (this._svg_height / 2)*/ - (this.dFull / 2)) + .5;

		let color: string | null = null;

		const midx = (width / 2) - .5;
		const midy = (height / 2) - .5;

		if (filled) {
			if (x == midx || y == midy) {
				color = SvgRenderer.COLOR_AXIS_FILLED;
			} else {
				color = SvgRenderer.COLOR_FILLED;
			}
		} else if (x == midx || y == midy) {
			if (xor(!!(x & 1), !!(y & 1))) {
				color = SvgRenderer.COLOR_AXIS_DARK;
			} else {
				color = SvgRenderer.COLOR_AXIS_LIGHT;
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
					fill: ${SvgRenderer.COLOR_BUILT};
				}

				.${SvgRenderer.CLASS_FILLED}.${SvgRenderer.CLASS_BUILT} {
					fill: ${SvgRenderer.COLOR_BUILT};
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
		for (let i = 0; i <= count; i++) {
			const atCenter = i === center;
			const fill = atCenter ? SvgRenderer.COLOR_AXIS_FILLED : SvgRenderer.COLOR_GRID;
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
