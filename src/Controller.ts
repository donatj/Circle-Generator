import { Circle, CircleModes } from "./Generators/Circle";
import { SvgRenderer } from "./Renderers/SvgRenderer";

export interface ControlAwareInterface {
	getControls(): HTMLElement[];
}

export function isControlAwareInterface(o: any): o is ControlAwareInterface {
	return o && (typeof o.getControls === "function");
}

export class MainController {

	private defaultWidth = 5;
	private defaultHeight = 5;

	private width = this.defaultWidth;
	private height = this.defaultHeight;

	constructor(private controls: HTMLElement, private result: HTMLElement) {
		this.render();

		this.makeControl("number", `${this.defaultWidth}`, (s) => {
			this.width = parseInt(s, 10);
			this.render();
		});

		this.makeControl("number", `${this.defaultHeight}`, (s) => {
			this.height = parseInt(s, 10);
			this.render();
		});

	}

	private makeControl(
		type: string, value: string, onAlter: (val: string) => void,
	): HTMLInputElement {
		const controlElm = document.createElement("input");
		controlElm.type = type;
		controlElm.value = value;

		this.controls.appendChild(controlElm);
		let timeout: number;
		const handler = () => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				onAlter(controlElm.value);
			}, 100);
		};
		controlElm.addEventListener("change", handler);
		controlElm.addEventListener("keyup", handler);

		return controlElm;
	}

	private render() {
		const ccc = new Circle(this.width, this.height);
		ccc.setMode(CircleModes.thin);

		if (isControlAwareInterface(ccc)) {
			for(const c of ccc.getControls() ) {
				this.controls.appendChild(c);
			}
		}

		// let rend = new Renderers.SvgRenderer();
		const rend = new SvgRenderer();
		rend.setGenerator(ccc);
		rend.render(this.width, this.height, this.result);

		if (isControlAwareInterface(rend)) {
			for(const c of rend.getControls() ) {
				this.controls.appendChild(c);
			}
		}

		rend.setScale(244);
	}

	// private getDownloadName(ext: string) {
	// 	return "Circle-" + this.width + "x" + this.height + "-" + (+new Date()) + "-output." + ext;
	// }

}
