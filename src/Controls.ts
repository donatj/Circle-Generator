export interface Control<T extends HTMLElement = HTMLElement> {
	element: T;
	label: string | null;
	group: string;
}

export interface ControlAwareInterface {
	getControls(): Control[];
}

export function isControlAwareInterface(o: unknown): o is ControlAwareInterface {
	return Boolean(o) && typeof (o as ControlAwareInterface).getControls === "function";
}

export class InfoControl implements Control<HTMLOutputElement> {
	public element: HTMLOutputElement = document.createElement("output");

	constructor(public group: string, public label: string | null) { }

	public setValue(value: string): void {
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

	if (attributes) {
		Object.assign(controlElm, attributes);
	}

	controlElm.type = type;
	controlElm.value = `${value}`;

	let timeout: ReturnType<typeof setTimeout>;
	const handler = () => {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			onAlter(controlElm.value);
		}, 50);
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
