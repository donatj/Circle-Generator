.PHONY: build dist
build:
	npx vite build

dist: build

.PHONY: clean
clean:
	rm -rf dist

.PHONY: lint lint-fix
lint:
	npx oxlint src

lint-fix:
	npx oxlint --fix src

.PHONY: format format-check
format:
	npx oxfmt .github .oxfmtrc.json index.html package.json src style.scss tsconfig.json vite.config.mjs

format-check:
	npx oxfmt --check .github .oxfmtrc.json index.html package.json src style.scss tsconfig.json vite.config.mjs
