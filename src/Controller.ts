import { SvgRenderer } from "./Renderers/SvgRenderer";
import { isDownloadable } from "./Renderers/RendererInterface";
import { Circle } from "./Generators/Circle";

export interface Control {
	element: HTMLElement,
	title: string,
}

export interface ControlAwareInterface {
	getControls(): Control[];
}

export function isControlAwareInterface(o: any): o is ControlAwareInterface {
	return o && (typeof o.getControls === "function");
}

export function makeControl(
	type: string, value: string, onAlter: (val: string) => void,
): HTMLInputElement {
	const controlElm = document.createElement("input");
	controlElm.type = type;
	controlElm.value = value;

	let timeout: number;
	const handler = () => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			onAlter(controlElm.value);
		}, 5);
	};
	controlElm.addEventListener("change", handler);
	controlElm.addEventListener("keyup", handler);
	controlElm.addEventListener("input", handler);

	return controlElm;
}

export class MainController {

	private generator = new Circle();
	private renderer = new SvgRenderer();

	constructor(private controls: HTMLElement, private result: HTMLElement) {
		this.renderControls();
		this.render();

		this.generator.changeEmitter.add(() => { this.render() });
		this.renderer.changeEmitter.add(() => { this.render() });
	}

	private renderControls() {
		this.controls.innerHTML = '';

		if (isControlAwareInterface(this.generator)) {
			for (const c of this.generator.getControls()) {
				const label = document.createElement('label');
				label.appendChild(document.createTextNode(`${c.title}:`))
				label.appendChild(c.element);
				this.controls.appendChild(label);
			}
		}

		if (isDownloadable(this.renderer)) {
			for (const download of this.renderer.getDownloads()) {
				// this.controls.appendChild(c);
				console.log(download);
			}
		}
	}

	private render() {
		this.renderer.render(this.result, this.generator);

		if (isControlAwareInterface(this.renderer)) {
			for (const c of this.renderer.getControls()) {
				this.controls.appendChild(c);
			}
		}

		this.renderer.setScale(544);
	}

}
