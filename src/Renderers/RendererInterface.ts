import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";

export interface RendererInterface {

	// add(x: number, y: number, filled: boolean): void;

	render(target: HTMLElement, generator: GeneratorInterface2D): void;

	// setGenerator(generator: GeneratorInterface2D): void;

	// setScale(scale: number): void;

	// constructor( max_x: number, max_y : number ) : void;

}

export interface RenderOutput {
	node: Node;
	setScale(scale: number): void;
}

export type Download = {
	type: string,
	extension: string,
	getBlob: () => string,
}

export interface Downloadable {
	getDownloads() : Download[];
}

export function isDownloadable(a:any) : a is Downloadable {
	return (a as Downloadable).getDownloads !== undefined;
}
