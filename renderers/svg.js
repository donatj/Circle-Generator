/**
 * Created by jdonat on 5/28/14.
 */
if(typeof Renderer == "undefined") {
	Renderer = {};
}

Renderer.Svg = function() {
	var _inner_content = '';
	var _svg_width = 1;
	var _svg_height = 1;

	var _max_x = 0;
	var _max_y = 0;

	var _dwidth = 5;
	var _dborder = 1;
	var _dfull = _dwidth + _dborder;

	var hasInlineSvg = function() {
		var div = document.createElement('div');
		div.innerHTML = '<svg/>';
		return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
	}

	this.init = function( max_x, max_y ) {
		_max_x = max_x;
		_max_y = max_y;
		_svg_width = _dfull * max_x;
		_svg_height = _dfull * max_y;
		_inner_content = '';
	};

	this.add = function( x, y, filled ) {

		var xp = ((x * _dfull) + (_svg_width / 2) - (_dfull / 2)) + .5;
		var yp = ((y * _dfull) + (_svg_height / 2) - (_dfull / 2)) + .5;

		var color = false;

		if( filled ) {
			if( x == 0 || y == 0 ) {
				color = '#808080';
			} else {
				color = '#FF0000';
			}
		} else if( x == 0 || y == 0 ) {
			if( x & 1 || y & 1 ) {
				color = '#EEEEEE';
			} else {
				color = '#F8F8F8';
			}
		}

		if( color !== false ) {
			_inner_content += '<rect x="' + xp + '" y="' + yp + '" fill="' + color + '" width="' + _dwidth + '" height="' + _dwidth + '" class="' + ( filled ? 'filled' : '') + '"/>';
		}
	};

	this.render = function() {
		var text = '';
		text += '<svg id="svg_circle" xmlns="http://www.w3.org/2000/svg" data-w="' + _svg_width + '" data-h="' + _svg_height + '" width="' + _svg_width + 'px" height="' + _svg_height + 'px" viewBox="0 0 ' + _svg_width + ' ' + _svg_height + '">';
		text += _inner_content;


		for( var ix = 0; ix < _svg_width; ix += _dfull ) {
			text += '<rect x="' + (ix + (_dwidth / 2)) + '" y="0" fill="#bbbbbb" width="' + _dborder + '" height="' + _svg_height + '" opacity=".4" />';
		}

		for( var iy = 0; iy < _svg_height; iy += _dfull ) {
			text += '<rect x="0" y="' + (iy + (_dwidth / 2)) + '" fill="#bbbbbb" width="' + _svg_width + '" opacity=".6" height="' + _dborder + '"/>';
		}

		text += '<line id="selection_line" x1="0" y1="0" x2="0" y2="0" style="stroke:rgb(0,255,0);" stroke-width="3" stroke-linecap="round" opacity="0">';

		text += '</svg>';

		if( hasInlineSvg() ) {
			return text;
		} else {
			return '<img id="svg_circle" src="data:image/svg+xml;base64,' + text.toBase64() + '">';
		}

	};

	this.scale = function( scale ) {
		var svgc = $$('#svg_circle');
		var aspect = svgc.get('data-h') / svgc.get('data-w');

		var scaleX = scale;
		var scaleY = scale * aspect;

		svgc.set('width', scale + 'px').set({'width': scaleX + 'px', 'height': scaleY + 'px'}).setStyles({'width': scaleX, 'height': scaleY});
	};
};
