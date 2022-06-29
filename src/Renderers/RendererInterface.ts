import { EventEmitter } from "../EventEmitter";
import { GeneratorInterface2D } from "../Generators/GeneratorInterface2D";

export interface RendererInterface {

	readonly changeEmitter : EventEmitter<void>;

	render(target: HTMLElement, generator: GeneratorInterface2D): void;

}

export interface RenderOutput {
	node: Node;
	setScale(scale: number): void;
}

export type Download = {
	type: string,
	extension: string,
	getBlob: () => string,
};
