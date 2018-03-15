"use strict";
var Controllers;
(function (Controllers) {
    var MainController = /** @class */ (function () {
        function MainController(controls, result) {
            var _this = this;
            this.controls = controls;
            this.result = result;
            this.defaultWidth = 100;
            this.defaultHeight = 40;
            this.width = this.defaultWidth;
            this.height = this.defaultHeight;
            this.render();
            this.makeControl("number", "" + this.defaultWidth, function (s) {
                _this.width = parseInt(s, 10);
                _this.render();
            });
            this.makeControl("number", "" + this.defaultHeight, function (s) {
                _this.height = parseInt(s, 10);
                _this.render();
            });
        }
        MainController.prototype.makeControl = function (type, value, onAlter) {
            var controlElm = document.createElement("input");
            controlElm.type = type;
            controlElm.value = value;
            this.controls.appendChild(controlElm);
            var timeout;
            var handler = function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    onAlter(controlElm.value);
                }, 100);
            };
            controlElm.addEventListener("change", handler);
            controlElm.addEventListener("keyup", handler);
            return controlElm;
        };
        MainController.prototype.render = function () {
            var ccc = new Generators.Circle(this.width, this.height);
            ccc.setMode("thin");
            // let rend = new Renderers.SvgRenderer();
            var rend = new Renderers.SvgRenderer();
            rend.setGenerator(ccc);
            rend.render(this.width, this.height, this.result);
        };
        return MainController;
    }());
    Controllers.MainController = MainController;
})(Controllers || (Controllers = {}));
var Generators;
(function (Generators) {
    var Circle = /** @class */ (function () {
        function Circle(width, height) {
            this.width = width;
            this.height = height;
            this.mode = "thick";
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
        Circle.prototype.setMode = function (mode) {
            this.mode = mode;
        };
        Circle.prototype.isFilled = function (x, y) {
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
        };
        return Circle;
    }());
    Generators.Circle = Circle;
})(Generators || (Generators = {}));
var Renderers;
(function (Renderers) {
    var SvgRenderer = /** @class */ (function () {
        function SvgRenderer() {
            this._inner_content = '';
            this._svg_width = 1;
            this._svg_height = 1;
            this._dwidth = 5;
            this._dborder = 1;
            this._dfull = this._dwidth + this._dborder;
            // public constructor(private _max_x: number, private _max_y: number) {
            // 	this._svg_width = this._dfull * _max_x;
            // 	this._svg_height = this._dfull * _max_y;
            // 	this._inner_content = '';
            // } 
            this.generator = null;
        }
        SvgRenderer.prototype.setGenerator = function (generator) {
            this.generator = generator;
        };
        SvgRenderer.prototype.hasInlineSvg = function () {
            var div = document.createElement('div');
            div.innerHTML = '<svg/>';
            return (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg';
        };
        ;
        SvgRenderer.prototype.add = function (x, y, width, height, filled) {
            var xp = ((x * this._dfull) /*+ (this._svg_width / 2)*/ - (this._dfull / 2)) + .5;
            var yp = ((y * this._dfull) /*+ (this._svg_height / 2)*/ - (this._dfull / 2)) + .5;
            var color = null;
            var midx = (width / 2) - .5;
            var midy = (height / 2) - .5;
            if (filled) {
                if (x == midx || y == midy) {
                    color = '#808080';
                }
                else {
                    color = '#FF0000';
                }
            }
            else if (x == midx || y == midy) {
                if (x & 1 || y & 1) {
                    color = '#EEEEEE';
                }
                else {
                    color = '#F8F8F8';
                }
            }
            if (color) {
                var fillstr = (filled ? 'filled' : '');
                this._inner_content += "<rect x=\"" + xp + "\" y=\"" + yp + "\" fill=\"" + color + "\" width=\"" + this._dwidth + "\" height=\"" + this._dwidth + "\" class=\"" + fillstr + "\"/>";
            }
        };
        ;
        SvgRenderer.prototype.render = function (width, height, target) {
            this._svg_width = this._dfull * width;
            this._svg_height = this._dfull * height;
            if (this.generator) {
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        this.add(x, y, width, height, this.generator.isFilled(x, y));
                    }
                }
            }
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
                target.innerHTML = text;
            }
            else {
                target.innerHTML = '<img id="svg_circle" src="data:image/svg+xml;base64,' + btoa(text) + '">';
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
    var TextRenderer = /** @class */ (function () {
        function TextRenderer() {
            this.generator = null;
        }
        TextRenderer.prototype.setGenerator = function (generator) {
            this.generator = generator;
        };
        TextRenderer.prototype.render = function (width, height, target) {
            target.innerHTML = '';
            if (!this.generator) {
                return;
            }
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var filled = this.generator.isFilled(x, y);
                    target.innerHTML += filled ? 'x' : '.';
                }
                target.innerHTML += "\n";
            }
        };
        return TextRenderer;
    }());
    Renderers.TextRenderer = TextRenderer;
})(Renderers || (Renderers = {}));
