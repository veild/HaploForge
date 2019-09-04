const Resize = {
	numVisibleHaplos: -1,

	updateHaploScrollHeight(new_lim = null) {
		HAP_DRAW_LIM = new_lim || Resize.numVisibleHaplos;

		// For small sets, shrink HAP_DRAW_LIM
		const num_marks = MarkerData.getLength() - 1;
		if (HAP_DRAW_LIM > num_marks) {
			HAP_DRAW_LIM = num_marks;
		}

		HaploBlock.end_index = HaploBlock.sta_index + HAP_DRAW_LIM;

		HaploWindow._bottom.rect.setHeight((HAP_DRAW_LIM + 3) * HAP_VERT_SPA);

		HaploBlock.redrawHaplos();
		SliderHandler.updateInputsByIndex();
		SliderHandler.updateSlide();
	},

	getYOffset() {
		return HaploWindow._top.rect.getAbsolutePosition().y + HaploWindow._top.rect.getHeight() + 10;
	},

	resizeCanvas(playing = 90) {
		if (stage !== null) {
			let stageHeight = window.innerHeight - 4;

			let newWidth = window.innerWidth;

			if (HaploWindow._background !== null) {
				// Check width
				const defWidth = HaploWindow._top.rect.getWidth() + HaploWindow._top.rect.getAbsolutePosition().x + 120; // 120 for CSS

				let width_over = false;

				if (defWidth > newWidth) {
					newWidth = defWidth;
					width_over = true;
				}

				HaploWindow._background.setWidth(newWidth / main_layer.getScale().x);
				SelectionMode._background.setWidth(newWidth / main_layer.getScale().x);
				stage.setWidth(newWidth);

				// Update the number of visible haplotypes number
				Resize.__numFittableHaplos();

				// Check height
				if (HAP_DRAW_LIM > Resize.numVisibleHaplos + 2) {
					const y_offs = Resize.getYOffset();
					stageHeight = y_offs + (HAP_DRAW_LIM + 3) * HAP_VERT_SPA;
				}

				Resize.updateHaploScrollHeight(SliderHandler.inputsLocked ? null : HAP_DRAW_LIM);

				if (width_over) {
					//Shorten height slightly caused by horizontal scroller now in existence
					stageHeight -= 15; // 15px
				}

				HaploWindow._background.setHeight(stageHeight);
				SelectionMode._background.setHeight(stageHeight / main_layer.getScale().y);
				stage.setHeight(stageHeight);

				if (
					ModeTracker.currentMode === ModeTracker.modes.pedcreate ||
					ModeTracker.currentMode === ModeTracker.modes.haploview
				) {
					FamSpacing.init(20);
				}

				haplo_layer.draw();
			} else {
				stage.setHeight(stageHeight);
				stage.setWidth(newWidth);
			}
		}
	},

	__numFittableHaplos() {
		const y_offset = Resize.getYOffset(),
			  avail_space = window.innerHeight - y_offset;

		Resize.numVisibleHaplos = Math.floor(avail_space / HAP_VERT_SPA) - 6;
	}
};
