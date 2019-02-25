import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";
import { RendererInterface } from "./RendererInterface";

export class SvgRenderer implements RendererInterface {

	private _inner_content = '';
	private _svg_width = 1;
	private _svg_height = 1;

	private _dwidth = 5;
	private _dborder = 1;
	private _dfull = this._dwidth + this._dborder;

	// public constructor(private _max_x: number, private _max_y: number) {
	// 	this._svg_width = this._dfull * _max_x;
	// 	this._svg_height = this._dfull * _max_y;
	// 	this._inner_content = '';
	// }

	private generator: GeneratorInterface2D | null = null;

	public setGenerator(generator: GeneratorInterface2D) {
		this.generator = generator;
	}

	private hasInlineSvg() {
		const div = document.createElement('div');
		div.innerHTML = '<svg/>';
		return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
	}

	private add(x: number, y: number, width: number, height: number, filled: boolean) {
		const xp = (((x+1) * this._dfull) /*+ (this._svg_width / 2)*/ - (this._dfull / 2)) + .5;
		const yp = (((y+1) * this._dfull) /*+ (this._svg_height / 2)*/ - (this._dfull / 2)) + .5;

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
			if (x & 1 || y & 1) {
				color = '#EEEEEE';
			} else {
				color = '#F8F8F8';
			}
		}

		if (color) {
			const fillstr = (filled ? 'filled' : '');
			this._inner_content += `<rect x="${xp}" y="${yp}" fill="${color}" width="${this._dwidth}" height="${this._dwidth}" class="${fillstr}"/>`;
		}
	}

	public render(width: number, height: number, target: HTMLElement): void {
		this._svg_width = this._dfull * (width + 1);
		this._svg_height = this._dfull * (height + 1);

		if (this.generator) {
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					this.add(x, y, width, height, this.generator.isFilled(x, y));
				}
			}
		}

		let text = '';
		text += '<svg id="svg_circle" xmlns="http://www.w3.org/2000/svg" data-w="' + this._svg_width + '" data-h="' + this._svg_height + '" width="' + this._svg_width + 'px" height="' + this._svg_height + 'px" viewBox="0 0 ' + this._svg_width + ' ' + this._svg_height + '">';
		text += this._inner_content;

		for (let ix = 0; ix < this._svg_width; ix += this._dfull) {
			text += '<rect x="' + (ix + (this._dwidth / 2)) + '" y="0" fill="#bbbbbb" width="' + this._dborder + '" height="' + this._svg_height + '" opacity=".4" />';
		}

		for (let iy = 0; iy < this._svg_height; iy += this._dfull) {
			text += '<rect x="0" y="' + (iy + (this._dwidth / 2)) + '" fill="#bbbbbb" width="' + this._svg_width + '" opacity=".6" height="' + this._dborder + '"/>';
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

}
