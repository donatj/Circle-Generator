import { GeneratorInterface2D } from "./Generators/GeneratorInterface2D";
import { SvgRenderer } from "./Renderers/SvgRenderer";
import { RendererInterface } from "./Renderers/RendererInterface";
import { Circle, CircleModes } from "./Generators/Circle";
import { StateHandler } from "./State";

export interface Control<T extends HTMLElement = HTMLElement> {
	element: T;
	label: string | null;
	group: string;
}

export interface ControlAwareInterface {
	getControls(): Control[];
}

export function isControlAwareInterface(o: any): o is ControlAwareInterface {
	return o && (typeof o.getControls === "function");
}

export class InfoControl implements Control<HTMLOutputElement> {
	public element: HTMLOutputElement = document.createElement("output");

	constructor(public group: string, public label: string | null) {}

	public setValue(value: string) {
		this.element.value = value;
	}
}

export function makeButtonControl(
	group: string,
	label: string | null,
	text: string,
	onClick: (e: MouseEvent) => void
): Control<HTMLButtonElement> {
	const button = document.createElement("button");
	button.innerText = text;

	button.addEventListener("click", onClick);

	return {
		element: button,
		label,
		group,
	};
}

export function makeInputControl(
	group: string,
	label: string | null,
	type: string,
	value: string | number,
	onAlter: (val: string) => void,
	attributes?: Partial<HTMLInputElement>
): Control<HTMLInputElement> {
	const controlElm = document.createElement("input");

	if(attributes) {
		Object.assign(controlElm, attributes);
	}

	controlElm.type = type;
	controlElm.value = `${value}`;

	let timeout: number;
	const handler = () => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			onAlter(controlElm.value);
		}, 50) as unknown as number; // TODO: TypeScript bug
	};
	controlElm.addEventListener("change", handler);
	controlElm.addEventListener("keyup", handler);
	controlElm.addEventListener("input", handler);

	return {
		label,
		group,
		element: controlElm,
	};
}

export class MainController {

	private stateMananger = new StateHandler();

	private generator: GeneratorInterface2D = new Circle(this.stateMananger.get("circle", {
		mode: CircleModes.thick,
		width: 5,
		height: 5,
		force: true,
	}));

	private renderer: RendererInterface = new SvgRenderer(this.stateMananger.get("svgRenderer", {
		scale: 544,
	}));

	constructor(private controls: HTMLElement, private result: HTMLElement) {
		this.renderControls();
		this.render();

		this.generator.changeEmitter.add(() => { this.render(); });
		this.renderer.changeEmitter.add(() => { this.render(); });
	}

	private renderControls() {
		this.controls.innerHTML = '';

		const controlProviders = [this.generator, this.renderer];

		const controlGroups: { [key: string]: Control[] } = {};

		for (const controlProvider of controlProviders) {
			if (isControlAwareInterface(controlProvider)) {
				for (const c of controlProvider.getControls()) {
					if (!controlGroups[c.group]) {
						controlGroups[c.group] = [];
					}

					controlGroups[c.group].push(c);
				}
			}
		}

		for (const group in controlGroups) {
			if (!controlGroups.hasOwnProperty(group)) {
				continue;
			}

			const groupElm = document.createElement("fieldset");
			const legend = document.createElement("legend");
			legend.innerText = group;
			groupElm.appendChild(legend);

			for (const c of controlGroups[group]) {

				const labelElm = document.createElement("label");
				groupElm.appendChild(labelElm);

				if (c.label) {
					labelElm.innerText = c.label;
				}

				labelElm.appendChild(c.element);
			}

			this.controls.appendChild(groupElm);
		}
	}

	private render() {
		this.renderer.render(this.result, this.generator);
	}

}
