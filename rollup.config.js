import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
	input: 'src/Controller.ts',    // Single entry point
	output: {
		dir: 'lib',     // Set output to a single file
		format: 'esm',  // `iife` works for single-file output
		name: 'circle',
		plugins: [terser()]
	},
	plugins: [
		typescript(),
	]
};