export function svgToCanvas(svgData: string): Promise<HTMLCanvasElement> {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (ctx === null) {
		throw new Error("Could not create canvas context");
	}

	const p = new Promise<HTMLCanvasElement>((resolve) => {
		const img = document.createElement("img");
		img.src = "data:image/svg+xml;base64," + btoa(svgData);

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0);

			resolve(canvas);
		};
	});

	return p;
}

export function triggerDownload(href: string, filename: string): void {
	const a = document.createElement('a');
	a.href = href;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

