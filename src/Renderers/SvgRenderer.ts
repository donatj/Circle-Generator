import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";
import { RendererInterface } from "./RendererInterface";
import { Control, ControlAwareInterface, InfoControl, makeButtonControl, makeInputControl } from "../Controller";
import { EventEmitter } from "../EventEmitter";
import { xor } from "../Math";
import { svgToCanvas } from "../Utils";

function isSvgElement(el: Node): el is SVGElement {
	return (el as SVGElement).namespaceURI === "http://www.w3.org/2000/svg";
}

interface SvgRendererState {
	scale: number;
}

export class SvgRenderer implements RendererInterface, ControlAwareInterface {

	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	private blocks = new InfoControl("Details", "blocks");

	private stacksOf64 = new InfoControl("Details", "stacks of 64");
	private stacksOf16 = new InfoControl("Details", "stacks of 16");

	public readonly changeEmitter = new EventEmitter<SvgRendererState>();

	constructor(private scaleSize: number) { }

	private triggerChange() {
		this.changeEmitter.trigger({
			scale: this.scaleSize,
		});
	}

	public getControls(): Control[] {

		const scale = makeInputControl('Render', 'scale', 'range', this.scaleSize, (val) => {
			this.scaleSize = parseInt(val, 10);
			this.scale();

			this.triggerChange();
		}, { min: "50", max: "3000" });

		return [
			scale,

			makeButtonControl('Download', null, 'PNG', async () => {
				if (!this.lastSvg) {
					throw new Error('No SVG to download');
				}

				const canvas = await svgToCanvas(this.lastSvg.outerHTML);
				const dataUrl = canvas.toDataURL();

				const a = document.createElement('a');
				a.href = dataUrl;
				a.download = (this.lastGenerator?.getDescription() || "circle") + "-download.png";
				document.body.appendChild(a);
				a.click();
			}),

			makeButtonControl('Download', null, 'SVG', async () => {
				if (!this.lastSvg) {
					throw new Error('No SVG to download');
				}

				const a = document.createElement('a');
				a.href = "data:image/svg+xml;base64," + btoa(this.lastSvg.outerHTML);
				a.download = (this.lastGenerator?.getDescription() || "circle") + "-download.svg";
				document.body.appendChild(a);
				a.click();
			}),

			this.blocks,
			this.stacksOf64,
			this.stacksOf16,
		];
	}

	private hasInlineSvg(): boolean {
		const div = document.createElement('div');
		div.innerHTML = '<svg/>';
		return Boolean(div.firstChild && isSvgElement(div.firstChild));
	}

	private add(x: number, y: number, width: number, height: number, filled: boolean): string {
		const xp = (((x + 1) * this.dFull) /*+ (this._svg_width / 2)*/ - (this.dFull / 2)) + .5;
		const yp = (((y + 1) * this.dFull) /*+ (this._svg_height / 2)*/ - (this.dFull / 2)) + .5;

		let color: string | null = null;

		const midx = (width / 2) - .5;
		const midy = (height / 2) - .5;

		let extra = "";
		if (filled) {
			if (x == midx || y == midy) {
				color = '#880000';
			} else {
				color = '#FF0000';
			}

			extra = 'onclick="this.style.fill=\'#7711AA\'"';
		} else if (x == midx || y == midy) {
			if (xor(!!(x & 1), !!(y & 1))) {
				color = '#AAAAAA';
			} else {
				color = '#CCCCCC';
			}
		}

		if (color) {
			const fillstr = (filled ? 'filled' : '');
			return `<rect x="${xp}" y="${yp}" fill="${color}" width="${this.dWidth}" height="${this.dWidth}" class="${fillstr}" data-x="${x}" data-y="${y}" ${extra}/>`;
		}

		return '';
	}

	private lastSvg: SVGElement | null = null;

	public render(target: HTMLElement, generator: GeneratorInterface2D): void {
		if (!this.hasInlineSvg()) {
			throw new Error(`SVG Renderer: No support for inline SVG. Please use a browser that supports SVG.`);
		}

		const svg = this.generateSVG(generator);

		target.innerHTML = svg;
		// const svgElm = target.firstChild as SVGElement;

		this.lastSvg = target.querySelector('svg');

		this.scale();
	}

	private lastGenerator: GeneratorInterface2D | null = null;

	private generateSVG(generator: GeneratorInterface2D): string {
		this.lastGenerator = generator;
		const { minX, maxX, minY, maxY } = generator.getBounds();
		const width = maxX - minX;
		const height = maxY - minY;
		const svgWidth = this.dFull * (width + 1);
		const svgHeight = this.dFull * (height + 1);
		const half = this.dWidth / 2;
		const centerX = width / 2;
		const centerY = height / 2;

		let text = `<svg id="svg_circle"
			xmlns="http://www.w3.org/2000/svg"
			data-w="${svgWidth}" data-h="${svgHeight}"
			width="${svgWidth}px" height="${svgHeight}px"
			viewBox="0 0 ${svgWidth} ${svgHeight}">`;

		let fillCount = 0;
		for (let y = minY; y < maxY; y++) {
			for (let x = minX; x < maxX; x++) {
				const filled = generator.isFilled(x, y);
				text += this.add(x, y, width, height, filled);
				if (filled) fillCount++;
			}
		}

		this.blocks.setValue(`${fillCount}`);
		this.stacksOf64.setValue(`${(fillCount / 64).toFixed(1)}`);
		this.stacksOf16.setValue(`${(fillCount / 16).toFixed(1)}`);

		// vertical grid lines
		text += this.renderGridLines(width, svgHeight, half, centerX, true);
		// horizontal grid lines
		text += this.renderGridLines(height, svgWidth, half, centerY, false);

		text += `</svg>`;
		return text;
	}

	private renderGridLines(
		count: number,
		length: number,
		offset: number,
		center: number,
		vertical: boolean
	): string {
		let svg = '';
		for (let i = 0; i <= count; i++) {
			const atCenter = i === center;
			const fill = atCenter ? '#880000' : '#bbbbbb';
			const opacity = atCenter ? '1' : '.3';
			if (vertical) {
				svg += `<rect x="${i * this.dFull + offset}" y="0" fill="${fill}"
						 width="${this.dBorder}" height="${length}" opacity="${opacity}" />`;
			} else {
				svg += `<rect x="0" y="${i * this.dFull + offset}" fill="${fill}"
						 width="${length}" height="${this.dBorder}" opacity="${opacity}" />`;
			}
		}
		return svg;
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

		var scale = this.scaleSize;
		scale = scale * (wn * .01);

		const scaleX = scale;
		const scaleY = scale * aspect;

		this.lastSvg.setAttribute('width', scaleX + 'px');
		this.lastSvg.setAttribute('height', scaleY + 'px');
		this.lastSvg.style.width = scaleX + 'px';
		this.lastSvg.style.height = scaleY + 'px';
	}
}
