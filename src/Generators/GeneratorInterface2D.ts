import { EventEmitter } from "../EventEmitter";

export type Bounds = {
	minX: number,
	maxX: number,

	minY: number,
	maxY: number,
}

export interface GeneratorInterface2D {

	readonly changeEmitter : EventEmitter<any|void>;

	isFilled(x: number, y: number): boolean;
	getBounds(): Bounds;

}
