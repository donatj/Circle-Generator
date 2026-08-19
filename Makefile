.PHONY: build
build: lib/generator.js style.css

lib/generator.js: $(shell find src -name "*.ts")
	npx rollup --config rollup.config.mjs

style.css: style.scss
	npx sass style.scss:style.css

.PHONY: dist
dist: lib/generator.js style.css index.html
	npx vite build

.PHONY: clean
clean:
	rm -rf dist
	rm -rf lib style.css

.PHONY: lint
lint:
	npx tslint -c tslint.json 'src/**/*.ts' --fix
