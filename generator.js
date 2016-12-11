window.addEvent('domready', function() {
	"use strict";

	//inputs
	var dia         = $('diameter'),
		height      = $('height'),
		scaler      = $('scaler'),
		linked      = $('linked'),
		thickness   = $('thickness'),
		downloadSVG = $('downloadSVG'),
		downloadPNG = $('downloadPNG'),
		border		= $('border');

	//outputs
	var resultblock = $('result'),
		blockcount  = $('blockcount');

	if( !!window.location.hash || (!!window.localStorage && !!window.localStorage.CircleHash) ) {
		try {
			var hashval = {};

			if( !!window.location.hash ) {
				hashval = JSON.decode(window.location.hash.replace(/^[# ]+/g, "").decodeBase64());
			} else {
				hashval = JSON.decode(window.localStorage.CircleHash);
			}
			dia.set('value', Math.max(hashval.width, 1));
			height.set('value', Math.max(hashval.height, 1));
			thickness.set('value', hashval.thickness);
			scaler.set('value', hashval.scaler);
			linked.checked = hashval.width == hashval.height;
		} catch(err) {
			if( console && console.log ) {
				console.log(err);
			}
		}

	}

	var distance  = function( x, y, ratio ) {
			return Math.sqrt((Math.pow(y * ratio, 2)) + Math.pow(x, 2));
		},
		filled    = function( x, y, radius, ratio ) {
			return distance(x, y, ratio) <= radius;
		},
		borderfilled = function( x, y, radius, ratio, border ) {
			var dist = distance(x, y, ratio);
			return (dist <= radius && dist >= radius - border);
		},
		fatfilled = function( x, y, radius, ratio ) {
			return filled(x, y, radius, ratio) && !(
				   filled(x + 1, y, radius, ratio) &&
				   filled(x - 1, y, radius, ratio) &&
				   filled(x, y + 1, radius, ratio) &&
				   filled(x, y - 1, radius, ratio) &&
				   filled(x + 1, y + 1, radius, ratio) &&
				   filled(x + 1, y - 1, radius, ratio) &&
				   filled(x - 1, y - 1, radius, ratio) &&
				   filled(x - 1, y + 1, radius, ratio)
				);
		};

	var hasSvg = document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
	var renderer = hasSvg ? new Renderer.Svg() : new Renderer.Table();

	if( !hasSvg ) {
		downloadSVG.setAttribute('disabled', 'disabled');
		downloadSVG.innerHTML = 'Download disabled - need newer browser!';
	}

	var hashTimeout = false;

	var draw = function() {
		var thick_t = thickness.get('value');
		var width_r = parseFloat(dia.value) / 2;
		var height_r = parseFloat(height.value) / 2;
		var ratio = width_r / height_r;
		var border_t = parseInt(border.value);

		var maxblocks_x, maxblocks_y;
		//var text = '';
		var ifilled = 0;

		if( (width_r * 2) % 2 == 0 ) {
			maxblocks_x = Math.ceil(width_r - .5) * 2 + 1;
		} else {
			maxblocks_x = Math.ceil(width_r) * 2;
		}

		if( (height_r * 2) % 2 == 0 ) {
			maxblocks_y = Math.ceil(height_r - .5) * 2 + 1;
		} else {
			maxblocks_y = Math.ceil(height_r) * 2;
		}

		renderer.init(maxblocks_x, maxblocks_y);
		var hash = JSON.encode({
			width    : width_r * 2,
			height   : height_r * 2,
			thickness: thick_t,
			scaler   : scaler.get('value'),
			border	 : border_t
		});

		//setting it every time was slow, pause a second and then set it
		window.clearTimeout(hashTimeout);
		hashTimeout = window.setTimeout(function() {
			if( window.localStorage ) {
				window.localStorage.CircleHash = hash;
			}

			window.location.hash = hash.toBase64();
		}, 1000);

		if( resultblock.get('data-hash') != hash ) {

			for( var y = -maxblocks_y / 2 + 1; y <= maxblocks_y / 2 - 1; y++ ) {
				for( var x = -maxblocks_x / 2 + 1; x <= maxblocks_x / 2 - 1; x++ ) {
					var xfilled;

					if( thick_t == 'bordered' ) {
						xfilled = borderfilled(x, y, width_r, ratio, border_t);
					} else if( thick_t == 'thick' ) {
						xfilled = fatfilled(x, y, width_r, ratio);
					} else if( thick_t == 'thin' ) {
						xfilled = fatfilled(x, y, width_r, ratio) && !(fatfilled(x + (x > 0 ? 1 : -1), y, width_r, ratio) && fatfilled(x, y + (y > 0 ? 1 : -1), width_r, ratio));
					} else {
						xfilled = filled(x, y, width_r, ratio);
					}

					ifilled += (!!xfilled) * 1;

					renderer.add(x, y, xfilled);
				}
			}

			var stacks = Math.floor(ifilled / 64);
			var remaining = ifilled - (stacks * 64);
			
			resultblock.set('data-hash', hash);
			resultblock.innerHTML = renderer.render();
			blockcount.set('html', ifilled + ' (' + stacks + ' stacks + ' + remaining + ' blocks)');
		}

		rescale();
	};

	var rescale = function() {
		renderer.scale(scaler.value);
	};

	var numcleanup = function() {
		this.set('value', parseInt(this.get('value'), 10).limit(1, 2000));

		if( linked.checked ) {
			if( this.get('id') == height.get('id') ) {
				dia.set('value', height.get('value'));
			} else {
				height.set('value', diameter.get('value'));
			}
		}
	};

	$$(dia, height).addEvent('keyup', numcleanup).addEvent('change', numcleanup);
	$$(dia, height, linked, thickness, border).addEvent('keyup', draw).addEvent('change', draw);

	scaler.addEvent('change', rescale);

	var svgToCanvas    = function( svgData, canvasHandler ) {
		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");

		var img = document.createElement("img");
		img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

		canvas.width = img.width;
		canvas.height = img.height;

		img.onload = function() {
			ctx.drawImage(img, 0, 0);

			canvasHandler(canvas);
		}
	}, getDownloadName = function( ext ) {
		return "Circle-" + diameter.get('value') + "x" + height.get('value') + "-" + (+new Date()) + "-output." + ext;
	};

	downloadSVG.addEvent('click', function() {
		saveAs(new Blob([resultblock.innerHTML]), getDownloadName("svg"));
	});

	downloadPNG.addEvent('click', function() {
		svgToCanvas(resultblock.innerHTML, function( canvas ) {
			var dataUrl = canvas.toDataURL();

			var a = document.createElement('a');
			a.href = dataUrl;
			a.download = getDownloadName("png");
			document.body.appendChild(a);
			a.click();
		});
	});

	draw();
});