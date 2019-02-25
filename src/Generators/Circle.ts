namespace Generators {

	type circleModes = "thick" | "thin" | "filled";

	export class Circle implements GeneratorInterface2D {

		constructor(private width: number, private height: number) { }

		private distance(x: number, y: number, ratio: number): number {
			return Math.sqrt((Math.pow(y * ratio, 2)) + Math.pow(x, 2));
		}

		private filled(x: number, y: number, radius: number, ratio: number): boolean {
			return this.distance(x, y, ratio) <= radius;
		}

		private fatfilled(x: number, y: number, radius: number, ratio: number): boolean {
			return this.filled(x, y, radius, ratio) && !(
				this.filled(x + 1, y, radius, ratio) &&
				this.filled(x - 1, y, radius, ratio) &&
				this.filled(x, y + 1, radius, ratio) &&
				this.filled(x, y - 1, radius, ratio) &&
				this.filled(x + 1, y + 1, radius, ratio) &&
				this.filled(x + 1, y - 1, radius, ratio) &&
				this.filled(x - 1, y - 1, radius, ratio) &&
				this.filled(x - 1, y + 1, radius, ratio)
			);
		}

		private thinfilled(x: number, y: number, radius: number, ratio: number): boolean {
			return this.fatfilled(x, y, radius, ratio) &&
				!(this.fatfilled(x + (x > 0 ? 1 : -1), y, radius, ratio)
					&& this.fatfilled(x, y + (y > 0 ? 1 : -1), radius, ratio));
		}

		private mode: circleModes = "thick";

		public setMode(mode: circleModes): void {
			this.mode = mode;
		}

		public isFilled(x: number, y: number): boolean {
			x = -.5 * (this.width - 2 * (x + .5));
			y = -.5 * (this.height - 2 * (y + .5));

			switch (this.mode) {
				case "thick": {
					return this.fatfilled(x, y, (this.width / 2), this.width / this.height);
				}
				case "thin": {
					return this.thinfilled(x, y, (this.width / 2), this.width / this.height);
				}
				default: {
					return this.filled(x, y, (this.width / 2), this.width / this.height);
				}
			}
		}

	}

}
