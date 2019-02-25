import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";
import { RendererInterface } from "./RendererInterface";

export class TextRenderer implements RendererInterface {

	private generator: GeneratorInterface2D | null = null;

	public setGenerator(generator: GeneratorInterface2D) {
		this.generator = generator;
	}

	public render(width: number, height: number, target: HTMLElement): void {
		target.innerHTML = '';

		if (!this.generator) {
			return;
		}

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const filled = this.generator.isFilled(x, y);
				target.innerHTML += filled ? 'x' : '.';
			}
			target.innerHTML += "\n";
		}
	}

}
