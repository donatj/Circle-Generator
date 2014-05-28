/**
 * Created by jdonat on 5/28/14.
 */
if(typeof Renderer == "undefined") {
	Renderer = {};
}

Renderer.Table = function() {
	var _row_data = {};
	var _max_x, _max_y;

	this.init = function( max_x, max_y ) {
		_max_x = max_x;
		_max_y = max_y;
		_row_data = {};
	}

	this.add = function( x, y, filled ) {
		var offset_y = y + _max_y;
		if( typeof _row_data[offset_y] == "undefined" ) {
			_row_data[offset_y] = '';
		}
		_row_data[offset_y] += '<td class="' + (filled ? 'filled' : '') + ' cgx' + x + ' cgy' + y + '"></td>';
	};

	this.render = function() {
		var text = '';
		text += '<table class="circle_output">';

		for( var row in _row_data ) {
			if( _row_data.hasOwnProperty(row) ) {
				text += '<tr>' + _row_data[row] + '</tr>';
			}
		}
		text += '</table>';

		text = '<p>Your browser does not support SVG, running in table compatibility mode. <br /> You will get <b>insanely</b> better performance from a modern browser like <a href="https://www.google.com/chrome/" target="_blank">Chrome</a>.</p>' + text;

		return text;
	};

	this.scale = function( scale ) {
		var tdwidth = scale / _max_x;
		$$('table.circle_output td').setStyles({'width': tdwidth, 'height': tdwidth});
	};
};
