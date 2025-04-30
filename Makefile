.PHONY: build
build: lib/Controller.js style.css

lib/Controller.js: $(shell find src -name "*.ts")
	npx rollup --config rollup.config.js

style.css: style.scss
	npx sass style.scss:style.css

dist: clean lib/Controller.js style.css index.html
	mkdir -p dist/lib
	cp lib/Controller.js dist/lib/Controller.js
	cp style.css index.html dist

.PHONY: clean
clean:
	rm -rf lib style.css

.PHONY: lint
lint:
	npx tslint -c tslint.json 'src/**/*.ts' --fix

