.PHONY: build dist
build:
	npx vite build

dist: build

.PHONY: clean
clean:
	rm -rf dist

.PHONY: lint
lint:
	npx tslint -c tslint.json 'src/**/*.ts' --fix
