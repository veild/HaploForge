const SliderHandler = {
	i_slider_top_y: 0,
	i_slider_length: 0,
	inputsLocked: false,

	// -- Drag specific -- //
	inputDragFunc(abspos) {
		let perc, rsindex;

		// Dampening in effect
		if (Keyboard.isShiftDown()) {
			MouseStyle.changeToArrowCursor();

			const center = SliderHandler.i_slider_top_y + SliderHandler.i_slider_length / 2;
			const diff_from_center = Math.abs(center - abspos.y);

			abspos.y = center + 0.2 * diff_from_center;
		} else {
			this.isTop ? MouseStyle.changeToVerticalN() : MouseStyle.changeToVerticalS();
		}

		const lockmargin = 30;
		let lockToRange = false;

		// Out of the way swirly glasses...
		if (this.isTop) {
			let atstart = false;

			if (abspos.y >= MarkerSlider._last_input2_posy) {
				abspos.y = MarkerSlider._last_input2_posy;
			}
			if (abspos.y <= MarkerSlider._rangeline_pos.y) {
				abspos.y = MarkerSlider._rangeline_pos.y + 1;
				atstart = true;
			}
			perc = (abspos.y - MarkerSlider._rangeline_pos.y) / MarkerSlider._config.slider_height;
			rsindex = atstart ? 0 : Math.floor(perc * MarkerData.getLength());

			MarkerSlider._last_input1_posy = abspos.y;

			if (Keyboard.isCtrlDown() && MarkerSlider._last_input2_ind) {
				const frontindex = MarkerSlider._last_input2_ind - Resize.numVisibleHaplos;
				//					backindex = frontindex - lockmargin;

				//				if (rsindex >= backindex && rsindex <= frontindex){
				lockToRange = true;
				rsindex = frontindex;
				//				}
			}
			MarkerSlider._last_input1_ind = rsindex;
		} else {
			// Always obstructing our forwards momentum...
			let atend = false;

			if (abspos.y <= MarkerSlider._last_input1_posy) {
				abspos.y = MarkerSlider._last_input1_posy;
			}
			if (abspos.y > MarkerSlider._rangeline_pos.y + MarkerSlider._config.slider_height) {
				abspos.y = MarkerSlider._rangeline_pos.y + MarkerSlider._config.slider_height;
				atend = true;
			}

			perc = (abspos.y - MarkerSlider._rangeline_pos.y) / MarkerSlider._config.slider_height;
			rsindex = atend ? MarkerData.getLength() - 1 : Math.floor(perc * MarkerData.getLength());

			MarkerSlider._last_input2_posy = abspos.y;

			if (Keyboard.isCtrlDown() && MarkerSlider._last_input1_ind) {
				const backindex = MarkerSlider._last_input1_ind + Resize.numVisibleHaplos;
				//					frontindex = backindex + lockmargin;

				//				if (rsindex >= backindex && rsindex <= frontindex){
				lockToRange = true;
				rsindex = backindex;
				//				}
			}
			MarkerSlider._last_input2_ind = rsindex;
		}

		let new_y = abspos.y;
		if (lockToRange) {
			new_y = SliderHandler.__updateSingleInputByIndex(rsindex, this.isTop);
		}
		SliderHandler.inputsLocked = lockToRange;

		this.message.setText(MarkerData.padded[rsindex]);

		SliderHandler.updateSlide(lockToRange);

		return { x: this.getAbsolutePosition().x, y: new_y };
	},

	sliderDragFunc(p) {
		// p.y is the top I bar

		// Get top and bottom I's;
		let top_I = p.y - MarkerSlider._rangeline_pos.y,
			bot_I = top_I + SliderHandler.i_slider_length;

		if (top_I < 0) {
			top_I = 0;
			bot_I = top_I + SliderHandler.i_slider_length;
		} else if (bot_I >= MarkerSlider._config.slider_height) {
			bot_I = MarkerSlider._config.slider_height;
			top_I = bot_I - SliderHandler.i_slider_length;
		}

		SliderHandler.updateInputsByPos(top_I, bot_I);

		return {
			x: this.getAbsolutePosition().x,
			y: top_I + MarkerSlider._rangeline_pos.y
		};
	},

	// --- Non-drag specific, but called by Drag Events
	updateSlide(rangelocked) {
		if (MarkerSlider._rangeline_pos === null) {
			return -1;
		}

		const offs = MarkerSlider._config.I_slider_offset;

		SliderHandler.i_slider_top_y = MarkerSlider._last_input1_posy - MarkerSlider._rangeline_pos.y;
		SliderHandler.i_slider_length = MarkerSlider._last_input2_posy - MarkerSlider._last_input1_posy;

		const top_slider = [ -offs, 0 ],
			  bot_slider = [ -offs, SliderHandler.i_slider_length ];

		MarkerSlider._slwin_group.setY(SliderHandler.i_slider_top_y);

		MarkerSlider._slwin_group.line.setPoints([
			-MarkerSlider._style.bevel + top_slider[0] + offs * 2,
			top_slider[1] + MarkerSlider._style.bevel,
			top_slider[0],
			top_slider[1] + MarkerSlider._style.bevel,
			bot_slider[0],
			bot_slider[1] + MarkerSlider._style.bevel,
			-MarkerSlider._style.bevel + bot_slider[0] + offs * 2,
			bot_slider[1] + MarkerSlider._style.bevel
		]);

		let diff = MarkerSlider._last_input2_ind - MarkerSlider._last_input1_ind;

		if (diff > Resize.numVisibleHaplos) {
			diff = `[${diff}]`;
		}
		if (MarkerData.hasGPData) {
			diff +=
				` (${(`${MarkerData.gp_array[MarkerSlider._last_input2_ind] -
        		MarkerData.gp_array[MarkerSlider._last_input1_ind]}`).slice(0, 5)} cM)`;
		}

		let strokeWidth = 1;
		if (rangelocked) {
			strokeWidth = 3;
		}
		MarkerSlider._slwin_group.line.setStrokeWidth(strokeWidth);
		MarkerSlider._sl_input1.line.setStrokeWidth(strokeWidth);
		MarkerSlider._sl_input2.line.setStrokeWidth(strokeWidth);

		MarkerSlider._slwin_group.message.setText(diff);
		MarkerSlider._slwin_group.message.setY(SliderHandler.i_slider_length / 2 - HAP_VERT_SPA / 2);
	},

	updateInputsByPos(top, bot) {
		MarkerSlider._sl_input1.setY(top);
		MarkerSlider._sl_input2.setY(bot);

		(MarkerSlider._last_input1_ind =
			top === 0 ? 0 : Math.floor(top * MarkerData.getLength() / MarkerSlider._config.slider_height)),
			(MarkerSlider._last_input2_ind =
				bot === MarkerSlider._config.slider_height
					? MarkerData.getLength() - 1
					: Math.floor(bot * MarkerData.getLength() / MarkerSlider._config.slider_height));

		MarkerSlider._sl_input1.message.setText(MarkerData.padded[MarkerSlider._last_input1_ind]);
		MarkerSlider._sl_input2.message.setText(MarkerData.padded[MarkerSlider._last_input2_ind]);

		MarkerSlider._last_input1_posy = top + MarkerSlider._rangeline_pos.y;
		MarkerSlider._last_input2_posy = bot + MarkerSlider._rangeline_pos.y;
	},

	__updateSingleInputByIndex(index, isTop) {
		if (index >= MarkerData.getLength()) {
			index = MarkerData.getLength() - 1;
		} else if (index < 0) {
			index = 0;
		}

		const ypos = index / MarkerData.getLength() * MarkerSlider._config.slider_height;

		if (isTop) {
			MarkerSlider._last_input1_ind = index;
			MarkerSlider._sl_input1.setY(ypos);
			MarkerSlider._sl_input1.message.setText(MarkerData.padded[MarkerSlider._last_input1_ind]);
			MarkerSlider._last_input1_posy = ypos + MarkerSlider._rangeline_pos.y;
		} else {
			MarkerSlider._last_input2_ind = index;
			MarkerSlider._sl_input2.setY(ypos);
			MarkerSlider._sl_input2.message.setText(MarkerData.padded[MarkerSlider._last_input2_ind]);
			MarkerSlider._last_input2_posy = ypos + MarkerSlider._rangeline_pos.y;
		}
		return ypos + MarkerSlider._rangeline_pos.y;
	},

	updateInputsByIndex(ind1, ind2) {
		ind1 = ind1 || HaploBlock.sta_index;
		ind2 = ind2 || HaploBlock.end_index;

		if (ind2 >= MarkerData.getLength()) {
			ind2 = MarkerData.getLength() - 1;
			ind1 = ind2 - HAP_DRAW_LIM;
		} else if (ind1 < 0) {
			ind1 = 0;
			ind2 = HAP_DRAW_LIM;
		}

		MarkerSlider._last_input1_ind = ind1;
		MarkerSlider._last_input2_ind = ind2;

		const top = MarkerSlider._last_input1_ind / MarkerData.getLength() * MarkerSlider._config.slider_height,
			  bot = MarkerSlider._last_input2_ind / MarkerData.getLength() * MarkerSlider._config.slider_height;

		if (MarkerSlider._sl_input1 !== null) {
			MarkerSlider._sl_input1.setY(top);
			MarkerSlider._sl_input2.setY(bot);

			MarkerSlider._sl_input1.message.setText(MarkerData.padded[MarkerSlider._last_input1_ind]);
			MarkerSlider._sl_input2.message.setText(MarkerData.padded[MarkerSlider._last_input2_ind]);

			MarkerSlider._last_input1_posy = top + MarkerSlider._rangeline_pos.y;
			MarkerSlider._last_input2_posy = bot + MarkerSlider._rangeline_pos.y;
		}
	},

	// ---- Called by mouseup events
	updateHaploPositions(resizecanvastoo) {
		HaploBlock.sta_index = MarkerSlider._last_input1_ind;
		HaploBlock.end_index = MarkerSlider._last_input2_ind;

		Resize.updateHaploScrollHeight(HaploBlock.end_index - HaploBlock.sta_index);
		HaploBlock.redrawHaplos(resizecanvastoo);
	}
};
