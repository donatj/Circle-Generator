namespace Renderers {

	export class TextRenderer implements RendererInterface {

		private generators: Generators.GeneratorInterface2D[] = [];

		public addGenerator(generator: Generators.GeneratorInterface2D) {
			this.generators.push(generator);
		}

		public render(width: number, height: number, target: HTMLElement): void {
			target.innerHTML = '';

			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					let filled = false;

					for (let ccc of this.generators) {
						if (filled) {
							break;
						}
						filled = filled || ccc.isFilled(x, y);
					}
					target.innerHTML += filled ? 'x' : '.';
				}
				target.innerHTML += "\n";
			}
		}

	}

}