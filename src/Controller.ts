import { SvgRenderer } from "./Renderers/SvgRenderer";
import { Circle } from "./Generators/Circle";

export interface Control<T extends HTMLElement = HTMLElement> {
	element: T,
	title: string,
}

export interface ControlAwareInterface {
	getControls(): Control[];
}

export function isControlAwareInterface(o: any): o is ControlAwareInterface {
	return o && (typeof o.getControls === "function");
}

export function makeButtonControl(title: string, text: string, onClick: (e: MouseEvent) => void) : Control<HTMLButtonElement> {
	const button = document.createElement("button");
	button.innerText = text;

	button.addEventListener("click", onClick);

	return {
		element: button,
		title,
	};
}

export function makeInputControl(
	title: string, type: string, value: string, onAlter: (val: string) => void,
): Control<HTMLInputElement> {
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

	return {
		title,
		element: controlElm,
	};
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

		const controlProviders = [ this.generator, this.renderer ];

		for(const controlProvider of controlProviders) {
			if (isControlAwareInterface(controlProvider)) {
				for (const c of controlProvider.getControls()) {
					const label = document.createElement('label');
					label.appendChild(document.createTextNode(`${c.title}:`))
					label.appendChild(c.element);
					this.controls.appendChild(label);
				}
			}
		}
	}

	private render() {
		this.renderer.render(this.result, this.generator);
		this.renderer.setScale(544);
	}

}
