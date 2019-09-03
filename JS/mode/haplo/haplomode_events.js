const HaploModeEvents = {
	shiftHaplotypes(delta) {
		HaploBlock.sta_index += delta;
		HaploBlock.end_index += delta;

		HaploModeEvents.moveHaplotypes();
	},

	moveHaplotypes() {
		SliderHandler.updateInputsByIndex();
		SliderHandler.updateSlide();

		HaploBlock.redrawHaplos(false);
	},

	// Public
	addKeys() {
		HaploModeEvents._addArrowKeys();
		HaploModeEvents._addPageKeys();
	},

	removeKeys() {
		HaploModeEvents._removeArrowKeys();
		HaploModeEvents._removePageKeys();
	},

	// KeyEvents
	_addArrowKeys() {
		Keyboard.addKeyDownTask('ArrowDown', HaploModeEvents._keyScrollDown);
		Keyboard.addKeyDownTask('ArrowUp', HaploModeEvents._keyScrollUp);
	},

	_removeArrowKeys() {
		Keyboard.removeKeyDownTask('ArrowDown', HaploModeEvents._keyScrollDown);
		Keyboard.removeKeyDownTask('ArrowUp', HaploModeEvents._keyScrollUp);
	},

	// Page Events
	_addPageKeys() {
		Keyboard.addKeyDownTask('PageDown', HaploModeEvents._pageScrollDown);
		Keyboard.addKeyDownTask('PageUp', HaploModeEvents._pageScrollUp);
	},

	_removePageKeys() {
		Keyboard.removeKeyDownTask('PageDown', HaploModeEvents._pageScrollDown);
		Keyboard.removeKeyDownTask('PageUp', HaploModeEvents._pageScrollUp);
	},

	_keyScrollUp() {
		HaploModeEvents._keyScroller(-5);
	},
	_keyScrollDown() {
		HaploModeEvents._keyScroller(5);
	},
	_pageScrollUp() {
		HaploModeEvents._keyScroller(-15);
	},
	_pageScrollDown() {
		HaploModeEvents._keyScroller(15);
	},

	_keyScroller(amount) {
		HaploModeEvents.shiftHaplotypes(amount);
	},

	// Mouse Events
	_addMouseWheel() {
		if (document.addEventListener) {
			document.addEventListener('mousewheel', HaploModeEvents._wheelHandler, false); //IE9, Chrome, Safari, Oper
			document.addEventListener('wheel', HaploModeEvents._wheelHandler, false); //Firefox
		} else {
			document.attachEvent('onmousewheel', HaploModeEvents._wheelHandler); //IE 6/7/8
		}
	},

	_removeMouseWheel() {
		if (document.addEventListener) {
			document.removeEventListener('mousewheel', HaploModeEvents._wheelHandler, false); //IE9, Chrome, Safari, Oper
			document.removeEventListener('wheel', HaploModeEvents._wheelHandler, false); //Firefox
		} else {
			document.detachEvent('onmousewheel', HaploModeEvents._wheelHandler); //IE 6/7/8
		}
	},

	_scrollBarsNotMiddle() {
		const wh = window.innerHeight,
			  st = document.body.scrollTop,
			  sh = document.body.scrollHeight;

		// Scroll haplotypes only when scrollbars are
		// either at top or bottom.
		return wh - st === wh || st + wh > sh;
	},

	_prevwheelstate: null,

	_wheelHandler(event) {
		if (HaploModeEvents._scrollBarsNotMiddle()) {
			let delta = event.detail;
			if (delta === 0) {
				delta = event.deltaY > 0 ? 3 : -3;
			}

			let wheelstatechanged = false;

			if (
				(delta > 0 && HaploModeEvents._prevwheelstate < 0) ||
				(delta < 0 && HaploModeEvents._prevwheelstate > 0)
			) {
				wheelstatechanged = true;
			}

			if (!wheelstatechanged) {
				HaploModeEvents.shiftHaplotypes(delta);
			}
			HaploModeEvents._prevwheelstate = delta;
		}
	}
};
