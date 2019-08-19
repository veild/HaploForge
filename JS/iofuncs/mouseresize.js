const MouseResize = {
	resize_modes: {
		pedcreate: ModeTracker.modes.pedcreate,
		haploview: ModeTracker.modes.haploview
	},

	_prevwheelstate: 0,
	_scale: 1,

	_wheelHandler(event) {
		let delta = event.detail;
		if (delta === 0) {
			delta = event.deltaY > 0 ? -0.1 : 0.1;
		}

		let wheelstatechanged = false;

		if ((delta > 0 && MouseResize._prevwheelstate < 0) || (delta < 0 && MouseResize._prevwheelstate > 0)) {
			wheelstatechanged = true;
		}

		if (!wheelstatechanged) {
			let new_scale = main_layer.getScale().x + delta;
			if (new_scale < 0.1) {
				new_scale = 0.1;
			}

			main_layer.setScale({
				x: new_scale,
				y: new_scale
			});
			utility.notify('Scale', new_scale.toFixed(1));
			main_layer.draw();
		}
		MouseResize._prevwheelstate = delta;
	},

	on(handler) {
		MouseWheel.on(MouseResize._wheelHandler);
		stage.setDraggable(true);
	},

	off(handler) {
		MouseWheel.off(MouseResize._wheelHandler);
		stage.setDraggable(false);
	}
};
