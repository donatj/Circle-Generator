export function distance(x: number, y: number, ratio: number): number {
	return Math.sqrt((Math.pow(y * ratio, 2)) + Math.pow(x, 2));
}

export function xor(left: boolean, right: boolean): boolean {
	return left ? !right : right;
}
