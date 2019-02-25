namespace Controllers {

	export class MainController {

		private defaultWidth = 100;
		private defaultHeight = 40;

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
			const ccc = new Generators.Circle(this.width, this.height);
			ccc.setMode("thin");
			// let rend = new Renderers.SvgRenderer();
			const rend = new Renderers.SvgRenderer();
			rend.setGenerator(ccc);

			rend.render(this.width, this.height, this.result);
		}

	}

}
