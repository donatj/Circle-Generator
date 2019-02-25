namespace Renderers {
/*
	export class TableRenderer implements RendererInterface {

		private _row_data: { [x: number]: string } = {};
		private _max_x = 0;
		private _max_y = 0;

		public constructor(max_x: number, max_y: number) {
			this._max_x = max_x;
			this._max_y = max_y;
			this._row_data = {};
		}

		public add(x: number, y: number, filled: boolean) {
			var offset_y = y + this._max_y;
			if (typeof this._row_data[offset_y] == "undefined") {
				this._row_data[offset_y] = '';
			}
			this._row_data[offset_y] += '<td class="' + (filled ? 'filled' : '') + ' cgx' + x + ' cgy' + y + '"></td>';
		};

		public render() {
			var text = '';
			text += '<table class="circle_output">';

			for (var row in this._row_data) {
				if (this._row_data.hasOwnProperty(row)) {
					text += '<tr>' + this._row_data[row] + '</tr>';
				}
			}
			text += '</table>';

			text = '<p>Your browser does not support SVG, running in table compatibility mode. <br /> You will get <b>insanely</b> better performance from a modern browser like <a href="https://www.google.com/chrome/" target="_blank">Chrome</a>.</p>' + text;

			return text;
		};

		public setScale(scale: number) {
			var tdwidth = scale / this._max_x;
			let tds = document.querySelectorAll('table.circle_output td');
			[].forEach.call(tds, function (td: HTMLTableCellElement) {
				td.style.width = tdwidth.toString();
				td.style.height = tdwidth.toString();
			});
		};

	}
*/
}
