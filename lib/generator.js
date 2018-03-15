"use strict";
var Generators;
(function (Generators) {
    var Circle = /** @class */ (function () {
        function Circle(width, height) {
            this.width = width;
            this.height = height;
        }
        Circle.prototype.distance = function (x, y, ratio) {
            return Math.sqrt((Math.pow(y * ratio, 2)) + Math.pow(x, 2));
        };
        Circle.prototype.filled = function (x, y, radius, ratio) {
            return this.distance(x, y, ratio) <= radius;
        };
        Circle.prototype.fatfilled = function (x, y, radius, ratio) {
            return this.filled(x, y, radius, ratio) && !(this.filled(x + 1, y, radius, ratio) &&
                this.filled(x - 1, y, radius, ratio) &&
                this.filled(x, y + 1, radius, ratio) &&
                this.filled(x, y - 1, radius, ratio) &&
                this.filled(x + 1, y + 1, radius, ratio) &&
                this.filled(x + 1, y - 1, radius, ratio) &&
                this.filled(x - 1, y - 1, radius, ratio) &&
                this.filled(x - 1, y + 1, radius, ratio));
        };
        Circle.prototype.thinfilled = function (x, y, radius, ratio) {
            return this.fatfilled(x, y, radius, ratio) &&
                !(this.fatfilled(x + (x > 0 ? 1 : -1), y, radius, ratio)
                    && this.fatfilled(x, y + (y > 0 ? 1 : -1), radius, ratio));
        };
        // public isFilled(x: number, y: number): boolean {
        // 	console.log(x, y, this.width / 2, this.width / this.height);
        // 	return this.thinfilled(x, y, (this.width / 2), this.width / this.height);
        // }
        Circle.prototype.isFilled = function (x, y) {
            x = -.5 * (this.width - 2 * (x + .5));
            y = -.5 * (this.height - 2 * (y + .5));
            return this.fatfilled(x, y, (this.width / 2), this.width / this.height);
        };
        return Circle;
    }());
    Generators.Circle = Circle;
})(Generators || (Generators = {}));
var Renderers;
(function (Renderers) {
    var SvgRenderer = /** @class */ (function () {
        function SvgRenderer(_max_x, _max_y) {
            this._max_x = _max_x;
            this._max_y = _max_y;
            this._inner_content = '';
            this._svg_width = 1;
            this._svg_height = 1;
            this._dwidth = 5;
            this._dborder = 1;
            this._dfull = this._dwidth + this._dborder;
            this._svg_width = this._dfull * _max_x;
            this._svg_height = this._dfull * _max_y;
            this._inner_content = '';
        }
        SvgRenderer.prototype.hasInlineSvg = function () {
            var div = document.createElement('div');
            div.innerHTML = '<svg/>';
            return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
        };
        ;
        SvgRenderer.prototype.add = function (x, y, filled) {
            var xp = ((x * this._dfull) + (this._svg_width / 2) - (this._dfull / 2)) + .5;
            var yp = ((y * this._dfull) + (this._svg_height / 2) - (this._dfull / 2)) + .5;
            var color = null;
            if (filled) {
                if (x == 0 || y == 0) {
                    color = '#808080';
                }
                else {
                    color = '#FF0000';
                }
            }
            else if (x == 0 || y == 0) {
                if (x & 1 || y & 1) {
                    color = '#EEEEEE';
                }
                else {
                    color = '#F8F8F8';
                }
            }
            if (color) {
                this._inner_content += '<rect x="' + xp + '" y="' + yp + '" fill="' + color + '" width="' + this._dwidth + '" height="' + this._dwidth + '" class="' + (filled ? 'filled' : '') + '"/>';
            }
        };
        ;
        SvgRenderer.prototype.render = function () {
            var text = '';
            text += '<svg id="svg_circle" xmlns="http://www.w3.org/2000/svg" data-w="' + this._svg_width + '" data-h="' + this._svg_height + '" width="' + this._svg_width + 'px" height="' + this._svg_height + 'px" viewBox="0 0 ' + this._svg_width + ' ' + this._svg_height + '">';
            text += this._inner_content;
            for (var ix = 0; ix < this._svg_width; ix += this._dfull) {
                text += '<rect x="' + (ix + (this._dwidth / 2)) + '" y="0" fill="#bbbbbb" width="' + this._dborder + '" height="' + this._svg_height + '" opacity=".4" />';
            }
            for (var iy = 0; iy < this._svg_height; iy += this._dfull) {
                text += '<rect x="0" y="' + (iy + (this._dwidth / 2)) + '" fill="#bbbbbb" width="' + this._svg_width + '" opacity=".6" height="' + this._dborder + '"/>';
            }
            text += '<line id="selection_line" x1="0" y1="0" x2="0" y2="0" style="stroke:rgb(0,255,0);" stroke-width="3" stroke-linecap="round" opacity="0">';
            text += '</svg>';
            if (this.hasInlineSvg()) {
                return text;
            }
            else {
                return '<img id="svg_circle" src="data:image/svg+xml;base64,' + btoa(text) + '">';
            }
        };
        ;
        SvgRenderer.prototype.setScale = function (scale) {
            var svgc = document.getElementById('svg_circle');
            if (!svgc) {
                throw "Error finding svg_circle";
            }
            var h = svgc.getAttribute('data-h');
            var w = svgc.getAttribute('data-w');
            if (!h || !w) {
                throw "error getting requisite data attributes";
            }
            var aspect = parseInt(h, 10) / parseInt(w, 10);
            var scaleX = scale;
            var scaleY = scale * aspect;
            // svgc.set('width', scale + 'px').set({
            // 	'width' : scaleX + 'px',
            // 	'height': scaleY + 'px'
            // }).setStyles({'width': scaleX, 'height': scaleY});
            svgc.setAttribute('width', scaleX + 'px');
            svgc.setAttribute('height', scaleY + 'px');
            svgc.style.width = scaleX + 'px';
            svgc.style.height = scaleY + 'px';
        };
        ;
        return SvgRenderer;
    }());
    Renderers.SvgRenderer = SvgRenderer;
})(Renderers || (Renderers = {}));
var Renderers;
(function (Renderers) {
    var TableRenderer = /** @class */ (function () {
        function TableRenderer(max_x, max_y) {
            this._row_data = {};
            this._max_x = 0;
            this._max_y = 0;
            this._max_x = max_x;
            this._max_y = max_y;
            this._row_data = {};
        }
        TableRenderer.prototype.add = function (x, y, filled) {
            var offset_y = y + this._max_y;
            if (typeof this._row_data[offset_y] == "undefined") {
                this._row_data[offset_y] = '';
            }
            this._row_data[offset_y] += '<td class="' + (filled ? 'filled' : '') + ' cgx' + x + ' cgy' + y + '"></td>';
        };
        ;
        TableRenderer.prototype.render = function () {
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
        ;
        TableRenderer.prototype.setScale = function (scale) {
            var tdwidth = scale / this._max_x;
            var tds = document.querySelectorAll('table.circle_output td');
            [].forEach.call(tds, function (td) {
                td.style.width = tdwidth.toString();
                td.style.height = tdwidth.toString();
            });
        };
        ;
        return TableRenderer;
    }());
    Renderers.TableRenderer = TableRenderer;
})(Renderers || (Renderers = {}));
var Renderers;
(function (Renderers) {
    var TextRenderer = /** @class */ (function () {
        function TextRenderer() {
            this.generators = [];
        }
        TextRenderer.prototype.addGenerator = function (generator) {
            this.generators.push(generator);
        };
        TextRenderer.prototype.render = function (width, height, target) {
            target.innerHTML = '';
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var filled = false;
                    for (var _i = 0, _a = this.generators; _i < _a.length; _i++) {
                        var ccc = _a[_i];
                        if (filled) {
                            break;
                        }
                        filled = filled || ccc.isFilled(x, y);
                    }
                    target.innerHTML += filled ? 'x' : '.';
                }
                target.innerHTML += "\n";
            }
        };
        return TextRenderer;
    }());
    Renderers.TextRenderer = TextRenderer;
})(Renderers || (Renderers = {}));
