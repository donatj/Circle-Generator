/*!
Copyright (c) Jesse G. Donat and contributors. Licensed under the MIT License.

This notice may not be removed or altered from any source distribution.
*/

import { GeneratorInterface2D } from "./Generators/GeneratorInterface2D";
import { SvgRenderer } from "./Renderers/SvgRenderer";
import { RendererInterface } from "./Renderers/RendererInterface";
import { Circle, CircleModes } from "./Generators/Circle";
import { StateHandler } from "./State";
import { isControlAwareInterface, Control } from "./Controls";

export class MainController {

	private stateMananger = new StateHandler();

	private generator: GeneratorInterface2D;

	private renderer: RendererInterface;

	constructor(private controls: HTMLElement, private result: HTMLElement) {
		const svgState = this.stateMananger.get("svgRenderer", {
			scale: 500,
		});
		const svgRenderer = new SvgRenderer(svgState.get('scale'), this.stateMananger);
		this.renderer = svgRenderer;

		svgRenderer.changeEmitter.add((e) => {
			svgState.set('scale', e.scale);
		});

		const circleState = this.stateMananger.get("circle", {
			mode: CircleModes.thick,
			width: 13,
			height: 13,
			force: true,
		});

		const w = circleState.get('width');
		const h = circleState.get('height');

		const circle = new Circle(
			w, h,
			circleState.get('mode'),
			circleState.get('force'),
		);
		this.generator = circle;
		this.generator.changeEmitter.add(() => { this.render(); });
		this.renderer.changeEmitter.add(() => { this.render(); });

		circle.changeEmitter.add((e) => {
			circleState.set('mode', e.state.mode);
			circleState.set('width', e.state.width);
			circleState.set('height', e.state.height);
			circleState.set('force', e.state.force);
		});

		if (w * h > 200 * 200) {
			const dlg = this.createConfirmationDialog(
				`Do you want to re-render the saved ${w} x ${h} shape? This may take a while or freeze.`,
				() => {
					this.renderControls();
					this.render();
				},
				() => {
					circleState.set('width', 5);
					circleState.set('height', 5);
					window.location.reload();
				}
			);

			result.appendChild(dlg);
			dlg.showModal();
			return;
		}

		this.renderControls();
		this.render();

		this.makeResultDraggable();
	}

	private createConfirmationDialog(
		message: string,
		onYes: () => void,
		onNo: () => void
	): HTMLDialogElement {
		const dlg = document.createElement('dialog');
		dlg.innerText = message;

		const frm = document.createElement('form');
		frm.method = 'dialog';

		const btnYes = document.createElement('button');
		btnYes.value = 'yes';
		btnYes.innerText = 'Yes';

		const btnNo = document.createElement('button');
		btnNo.innerText = 'No';
		btnNo.value = 'no';

		frm.appendChild(btnYes);
		frm.appendChild(btnNo);
		frm.style.padding = '1em';
		frm.style.display = 'flex';
		frm.style.columnGap = '1em';

		dlg.appendChild(frm);

		dlg.addEventListener("close", () => {
			if (dlg.returnValue === "yes") {
				onYes();
			} else {
				onNo();
			}
		});

		return dlg;
	}

	private makeResultDraggable() {
		let isDown = false;
		const el = this.result;

		el.style.cursor = "grab";
		el.style.userSelect = "none";
		// el.style.touchAction = "none";

		el.addEventListener("pointerdown", (e: PointerEvent) => {
			const target = e.target as HTMLElement|SVGElement|null;
			if (target && target.classList.contains("filled")) {
				return;
			}

			if (e.pointerType !== "mouse") return;
			isDown = true;
			el.setPointerCapture(e.pointerId);
			el.style.cursor = "grabbing";
		});

		el.addEventListener("pointermove", (e: PointerEvent) => {
			if (!isDown) return;
			el.scrollBy(-e.movementX, -e.movementY);
		});

		el.addEventListener("pointerup", (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return;
			isDown = false;
			el.releasePointerCapture(e.pointerId);
			el.style.cursor = "grab";
		});
	}


	private renderControls() {
		this.controls.innerHTML = '';

		const controlProviders = [this.generator, this.renderer];

		const controlGroups: { [key: string]: Control[] } = {};

		for (const controlProvider of controlProviders) {
			if (isControlAwareInterface(controlProvider)) {
				for (const c of controlProvider.getControls()) {
					if (!controlGroups[c.group]) {
						controlGroups[c.group] = [];
					}

					controlGroups[c.group].push(c);
				}
			}
		}

		for (const group in controlGroups) {
			if (!controlGroups.hasOwnProperty(group)) {
				continue;
			}

			const groupElm = document.createElement("fieldset");
			const legend = document.createElement("legend");
			legend.innerText = group;
			groupElm.appendChild(legend);

			for (const c of controlGroups[group]) {

				const labelElm = document.createElement("label");
				groupElm.appendChild(labelElm);

				if (c.label) {
					labelElm.innerText = c.label;
				}

				labelElm.appendChild(c.element);
			}

			this.controls.appendChild(groupElm);
		}
	}

	private render() {
		this.renderer.render(this.result, this.generator);
	}

}
