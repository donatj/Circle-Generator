.PHONY: build
build: lib/generator.js style.css

lib/generator.js: $(shell find src -name "*.ts")
	npx webpack --mode production

style.css: style.scss
	npx sass style.scss:style.css

dist: clean lib/generator.js style.css index.html
	mkdir -p dist/lib
	cp lib/generator.js dist/lib/generator.js
	cp style.css index.html dist

.PHONY: clean
clean:
	rm -rf lib style.css

.PHONY: lint
lint:
	./node_modules/.bin/tslint -c tslint.json 'src/**/*.ts' --fix

