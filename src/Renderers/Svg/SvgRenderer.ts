import { GeneratorInterface2D } from "../../Generators/GeneratorInterface2D";
import { RendererInterface, RenderOutput } from "../RendererInterface";
import { Control, ControlAwareInterface, ControlGroup, InfoControl, makeButtonControl } from "../../Controls";
import { EventEmitter } from "../../EventEmitter";
import { xor } from "../../Math";
import { svgToCanvas, triggerDownload } from "../../Utils";
import { StateHandler } from "../../State";
import { SvgHandler } from "./SvgHandler";
import { CLASS_BUILT, CLASS_FILLED, ATTR_X, ATTR_Y, ATTR_W, ATTR_H, SVG_NAMESPACE, SVG_ID, COLOR_SCHEMES, assertStringIsKeyOfColorSchemes, ColorScheme } from "./SvgConstants";

interface SvgRendererState {
	scale: number;
	colorScheme: ColorScheme;
}

export class SvgRenderer implements RendererInterface, ControlAwareInterface {

	// Dimensions
	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	// Info controls
	private blocks = new InfoControl(ControlGroup.Details, "blocks");
	private stacksOf64 = new InfoControl(ControlGroup.Details, "stacks of 64");
	private stacksOf16 = new InfoControl(ControlGroup.Details, "stacks of 16");

	public readonly changeEmitter = new EventEmitter<SvgRendererState>();

	private interactionHandler: SvgHandler | null = null;

	private colorScheme: keyof typeof COLOR_SCHEMES;
	private svgRendererState: StateHandler;

	constructor(private scaleSize: number, stateHandler: StateHandler) {
		this.svgRendererState = stateHandler;

		const state = stateHandler.get<SvgRendererState>('svgRenderer', {
			scale: scaleSize,
			colorScheme: 'classic'
		});

		this.colorScheme = state.get('colorScheme');
	}

	private getColors() {
		const scheme = COLOR_SCHEMES[this.colorScheme] || COLOR_SCHEMES.classic;
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

		for (const key of Object.keys(COLOR_SCHEMES)) {
			assertStringIsKeyOfColorSchemes(key);
			const scheme = COLOR_SCHEMES[key];
			const opt = document.createElement('option');
			opt.value = key;
			opt.innerText = scheme.name;
			select.appendChild(opt);

			if (key === this.colorScheme) {
				opt.selected = true;
			}
		}

		select.addEventListener('change', () => {
			assertStringIsKeyOfColorSchemes(select.value);
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
		return [

			makeButtonControl(ControlGroup.Download, null, 'PNG', async () => {
				if (!this.interactionHandler) {
					throw new Error('No SVG to download');
				}

				const svgElement = this.interactionHandler.getSvgElement();
				const canvas = await svgToCanvas(svgElement.outerHTML);
				const dataUrl = canvas.toDataURL();
				const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.png";

				triggerDownload(dataUrl, filename);
			}),

			makeButtonControl(ControlGroup.Download, null, 'SVG', async () => {
				if (!this.interactionHandler) {
					throw new Error('No SVG to download');
				}

				const svgElement = this.interactionHandler.getSvgElement();
				const href = "data:image/svg+xml;base64," + btoa(svgElement.outerHTML);
				const filename = (this.lastGenerator?.getDescription() || "circle") + "-download.svg";

				triggerDownload(href, filename);
			}),
			{ element: this.createColorSchemeSelect(), label: 'Color Scheme', group: ControlGroup.Render },

			this.blocks,
			this.stacksOf64,
			this.stacksOf16,
		];
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
			const classStr = filled ? CLASS_FILLED : '';
			return `<rect x="${xp}" y="${yp}" fill="${color}" width="${this.dWidth}" height="${this.dWidth}" class="${classStr}" ${ATTR_X}="${x}" ${ATTR_Y}="${y}" />`;
		}

		return '';
	}



	public render(target: HTMLElement, generator: GeneratorInterface2D): RenderOutput {
		const [svg, descriptor] = this.generateSVG(generator);

		this.interactionHandler = new SvgHandler(
			svg,
			this.scaleSize,
			this.svgRendererState,
			descriptor,
		);
		this.interactionHandler.setScale(this.scaleSize);

		target.innerHTML = '';
		target.appendChild(svg);

		return this.interactionHandler;
	}

	private lastGenerator: GeneratorInterface2D | null = null;

	private generateSVG(generator: GeneratorInterface2D): [SVGElement, string] {
		const bounds = generator.getBounds();

		this.lastGenerator = generator;
		const { minX, maxX, minY, maxY } = bounds;
		const width = maxX - minX;
		const height = maxY - minY;

		const svgWidth = this.dFull * (width + 1);
		const svgHeight = this.dFull * (height + 1);
		const half = this.dWidth / 2;
		const centerX = width / 2;
		const centerY = height / 2;

		const parts: string[] = [];
		const colors = this.getColors();

		parts.push(`<svg id="${SVG_ID}"
			xmlns="${SVG_NAMESPACE}"
			${ATTR_W}="${svgWidth}" ${ATTR_H}="${svgHeight}"
			width="${svgWidth}px" height="${svgHeight}px"
			viewBox="0 0 ${svgWidth} ${svgHeight}">
			<style>
				.${CLASS_FILLED} {
					cursor: pointer;
					transition: fill 0.3s;
				}

				.${CLASS_FILLED}:hover {
					fill: ${colors.built};
				}

				.${CLASS_FILLED}.${CLASS_BUILT} {
					fill: ${colors.built};
				}

				.${CLASS_FILLED}.${CLASS_BUILT}:hover {
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

		const parser = new DOMParser();
		const doc = parser.parseFromString(parts.join(''), "image/svg+xml");

		return [doc.documentElement as any as SVGElement, generator.getDescription()];
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


}
