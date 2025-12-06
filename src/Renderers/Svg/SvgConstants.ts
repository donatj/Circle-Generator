/**
 * Shared constants for SVG rendering and interaction
 */

// CSS class names
export const CLASS_FILLED = 'filled';
export const CLASS_BUILT = 'built';

// Data attributes
export const ATTR_X = 'data-x';
export const ATTR_Y = 'data-y';
export const ATTR_W = 'data-w';
export const ATTR_H = 'data-h';

// SVG namespace and identifiers
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const SVG_ID = 'svg_circle';

export const COLOR_SCHEMES = {
	classic: {
		name: 'Classic',
		colors: {
			axisFilled: '#880000',
			filled: '#FF0000',
			axisLight: '#CCCCCC',
			axisDark: '#AAAAAA',
			grid: '#bbbbbb',
			built: '#7711AA',
		}
	},
	ocean: {
		name: 'Ocean',
		colors: {
			axisFilled: '#003366',
			filled: '#0066CC',
			axisLight: '#CCE5FF',
			axisDark: '#99CCFF',
			grid: '#B3D9FF',
			built: '#00CC99',
		}
	},
	forest: {
		name: 'Forest',
		colors: {
			axisFilled: '#1B4D1B',
			filled: '#2E7D32',
			axisLight: '#C8E6C9',
			axisDark: '#A5D6A7',
			grid: '#B9D8B9',
			built: '#FFA726',
		}
	},
	sunset: {
		name: 'Sunset',
		colors: {
			axisFilled: '#B71C1C',
			filled: '#FF5722',
			axisLight: '#FFE0B2',
			axisDark: '#FFCC80',
			grid: '#FFD699',
			built: '#9C27B0',
		}
	},
	monochrome: {
		name: 'Monochrome',
		colors: {
			axisFilled: '#000000',
			filled: '#404040',
			axisLight: '#F0F0F0',
			axisDark: '#D0D0D0',
			grid: '#C0C0C0',
			built: '#808080',
		}
	},
	sunny: {
		name: 'Sunny Day',
		colors: {
			axisFilled: '#0072B2',
			filled: '#56B4E9',
			axisLight: '#F0E442',
			axisDark: '#E69F00',
			grid: '#D0D0D0',
			built: '#D55E00',
		}
	},
} as const;

export type ColorScheme = keyof typeof COLOR_SCHEMES;

export function assertStringIsKeyOfColorSchemes(key: string): asserts key is ColorScheme {
	if (!(key in COLOR_SCHEMES)) {
		throw new Error(`Invalid color scheme key: ${key}`);
	}
}
