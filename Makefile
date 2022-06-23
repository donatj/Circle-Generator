.PHONY: build
build: lib/generator.js style.css

lib/generator.js:
	npx webpack --mode production

style.css: style.scss
	npx sass style.scss:style.css

clean:
	rm -rf lib style.css

.PHONY: lint
lint:
	./node_modules/.bin/tslint -c tslint.json 'src/**/*.ts' --fix

