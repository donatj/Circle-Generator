import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
	base: './',
	build: {
		outDir: 'dist',
	},
	plugins: [viteSingleFile({ removeViteModuleLoader: true })],
});
