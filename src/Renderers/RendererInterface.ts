import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";

export interface RendererInterface {

	// add(x: number, y: number, filled: boolean): void;

	render(width: number, height: number, target : HTMLElement) : void;

	setGenerator(generator: GeneratorInterface2D) : void;

	// setScale(scale: number): void;

	// constructor( max_x: number, max_y : number ) : void;

}

export interface RenderOutput {
	node: Node;
	setScale(scale: number): void;
}
