
.PHONY: lint
lint:
	./node_modules/.bin/tslint -c tslint.json 'src/**/*.ts' --fix

