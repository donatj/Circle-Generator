export type Bounds = {
	minX: number,
	maxX: number,

	minY: number,
	maxY: number,
}

export interface GeneratorInterface2D {

	isFilled(x: number, y: number): boolean;
	getBounds(): Bounds;

}
