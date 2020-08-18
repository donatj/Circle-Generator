import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";
import { RendererInterface, Downloadable } from "./RendererInterface";
import { ControlAwareInterface } from "../Controller";
import { EventEmitter } from "../EventEmitter";

export class SvgRenderer implements RendererInterface, Downloadable, ControlAwareInterface {

	private innerContent = '';

	private dWidth = 5;
	private dBorder = 1;
	private dFull = this.dWidth + this.dBorder;

	// public constructor(private _max_x: number, private _max_y: number) {
	// 	this._svg_width = this._dfull * _max_x;
	// 	this._svg_height = this._dfull * _max_y;
	// 	this._inner_content = '';
	// }

	public readonly changeEmitter = new EventEmitter<void>();

	private generator: GeneratorInterface2D | null = null;

	public setGenerator(generator: GeneratorInterface2D) {
		this.generator = generator;
	}

	public getControls() {
		return [];
	}

	private hasInlineSvg() : boolean {
		const div = document.createElement('div');
		div.innerHTML = '<svg/>';
		return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
	}

	private add(x: number, y: number, width: number, height: number, filled: boolean) : string {
		const xp = (((x + 1) * this.dFull) /*+ (this._svg_width / 2)*/ - (this.dFull / 2)) + .5;
		const yp = (((y + 1) * this.dFull) /*+ (this._svg_height / 2)*/ - (this.dFull / 2)) + .5;

		let color: string | null = null;

		const midx = (width / 2) - .5;
		const midy = (height / 2) - .5;

		if (filled) {
			if (x == midx || y == midy) {
				color = '#808080';
			} else {
				color = '#FF0000';
			}
		} else if (x == midx || y == midy) {
			if (xor(!!(x & 1), !!(y & 1))) {
				color = '#EEEEEE';
			} else {
				color = '#F8F8F8';
			}
		}

		if (color) {
			const fillstr = (filled ? 'filled' : '');
			return `<rect x="${xp}" y="${yp}" fill="${color}" width="${this.dWidth}" height="${this.dWidth}" class="${fillstr}"/>`;
		}

		return '';
	}

	public render(target: HTMLElement): void {
		if (!this.generator) {
			throw new Error("missing generator");
		}

		const bounds = this.generator.getBounds();

		const width = bounds.maxX - bounds.minX;
		const height = bounds.maxY - bounds.minY;

		const svgWidth = this.dFull * (width + 1);
		const svgHeight = this.dFull * (height + 1);

		let text = `<svg id="svg_circle" xmlns="http://www.w3.org/2000/svg" data-w="${svgWidth}" data-h="${svgHeight}" width="${svgWidth}px" height="${svgHeight}px" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				text += this.add(x, y, width, height, this.generator.isFilled(x, y));
			}
		}

		text += this.innerContent;

		for (let ix = 0; ix < svgWidth; ix += this.dFull) {
			text += `<rect x="${(ix + (this.dWidth / 2))}" y="0" fill="#bbbbbb" width="${this.dBorder}" height="${svgHeight}" opacity=".4" />`;
		}

		for (let iy = 0; iy < svgHeight; iy += this.dFull) {
			text += `<rect x="0" y="${(iy + (this.dWidth / 2))}" fill="#bbbbbb" width="${svgWidth}" opacity=".6" height="${this.dBorder}"/>`;
		}

		text += '<line id="selection_line" x1="0" y1="0" x2="0" y2="0" style="stroke:rgb(0,255,0);" stroke-width="3" stroke-linecap="round" opacity="0">';

		text += '</svg>';

		if (this.hasInlineSvg()) {
			target.innerHTML = text;
		} else {
			target.innerHTML = '<img id="svg_circle" src="data:image/svg+xml;base64,' + btoa(text) + '">';
		}
	}

	public setScale(scale: number) {
		const svgc = document.getElementById('svg_circle');
		if (!svgc) {
			throw new Error("Error finding svg_circle");
		}
		const h = svgc.getAttribute('data-h');
		const w = svgc.getAttribute('data-w');
		if (!h || !w) {
			throw new Error("error getting requisite data attributes");
		}

		const aspect = parseInt(h, 10) / parseInt(w, 10);

		const scaleX = scale;
		const scaleY = scale * aspect;

		// svgc.set('width', scale + 'px').set({
		// 	'width' : scaleX + 'px',
		// 	'height': scaleY + 'px'
		// }).setStyles({'width': scaleX, 'height': scaleY});

		svgc.setAttribute('width', scaleX + 'px');
		svgc.setAttribute('height', scaleY + 'px');
		svgc.style.width = scaleX + 'px';
		svgc.style.height = scaleY + 'px';
	}

	public getDownloads() {
		return [];
	}
}
