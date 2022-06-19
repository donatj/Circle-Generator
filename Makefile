.PHONY: build
build lib/generator.js:
	npx webpack --mode production

.PHONY: lint
lint:
	./node_modules/.bin/tslint -c tslint.json 'src/**/*.ts' --fix

