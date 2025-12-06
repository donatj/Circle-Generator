export class NeverError extends Error {
	constructor(_n: never) {
		super("This should never happen");
	}
}
