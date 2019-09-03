const SelectionMode = {
	_ids_map: {}, // Generational map
	_ids: {}, // Just a map of ids
	_items: {},

	_select_group: null,
	_background: null,
	_exit: null,

	toggle_selection_affecteds: null,
	toggle_selection_all: null,

	// use this instead of "destroy" for general mode use-cases
	quit() {
		HaploWindow.destroy();
		SelectionMode.destroy();
		ButtonModes.setToHaploView();
	},

	destroy: function stopSelectionMode() {
		if (HomologyMode._active) {
			HomologyMode.quit();
		}

		SelectionMode._select_group.destroyChildren();
		SelectionMode._select_group.destroy();
		SelectionMode._background.destroy();

		if (SelectionMode._exit !== null) {
			SelectionMode._exit.destroy();
		}

		// Reset all
		SelectionMode._ids_map = {};
		SelectionMode._ids = {};
		SelectionMode._items = {};

		//Delete zoom
		MarkerSlider.makeVisible(false);

		haplo_layer.draw();
		main_layer.draw();
	},

	init: function startSelectionMode() {
		SelectionAction.reset();
		ButtonModes.setToSelectionMode();

		// Transformed stage requires recalculation of what's being presented on screen
		let stage_offset = stage.getAbsolutePosition(),
			stage_scale = main_layer.getScale();

		let stage_x = -stage_offset.x / stage_scale.x,
			stage_y = -stage_offset.y / stage_scale.y,
			stage_w = stage.getWidth() / stage_scale.x,
			stage_h = stage.getHeight() / stage_scale.y;

		// Main selection layer
		SelectionMode._select_group = new Kinetic.Group({
			x: stage_x,
			y: stage_y,
			width: stage_w,
			height: stage_h
		});

		SelectionMode._background = new Kinetic.Rect({
			x: 0,
			y: 0,
			width: stage_w,
			height: stage_h,
			fill: 'black',
			strokeWidth: 0,
			opacity: 0.1
		});

		SelectionMode._select_group.add(SelectionMode._background);

		uniqueGraphOps.foreachfam(fid => {
			const text_butt = uniqueGraphOps.getFam(fid).group.fam_title_text;
			const text_bounder = SelectionGraphics.addInvisibleBounder(text_butt.getAbsolutePosition(), fid, true);

			SelectionMode._select_group.add(text_bounder);

			let all_no_haplo = true;

			uniqueGraphOps.foreachnode((node_id, fid) => {
				if (node_id != 0) {
					const key = `${fid}_${node_id}`;

					const hasHaplo = familyMapOps.getPerc(node_id, fid).hasHaplo();
					//console.log("HasHaplo:", hasHaplo, node_id, fid)

					if (hasHaplo) {
						all_no_haplo = false;
					}

					const gfx = uniqueGraphOps.getFam(fid).nodes[node_id].graphics,
						  pos = gfx.getAbsolutePosition(),
						  bounder = SelectionGraphics.addBounder(pos, key, true, hasHaplo, stage_scale);

					gfx.attrs.draggable = false;

					// By default not enabled
					SelectionMode._items[key] = {
						box: bounder,
						selected: false,
						graphics: gfx
					};
					SelectionMode._select_group.add(bounder);
				}
			});

			if (all_no_haplo) {
				utility.notify('Error', 'No haplotypes detected', 4);
				SelectionMode.toggle_selection_all = false;
				SelectionMode.quit();
			}
		});

		// Exit button
		SelectionMode._exit = addExitButton(
			{
				x: 20,
				y: 20,
				scale: stage_scale
			},
			SelectionMode.quit,
			3
		);
		SelectionMode._select_group.add(SelectionMode._exit);

		main_layer.add(SelectionMode._select_group);
		SelectionMode._select_group.setZIndex(20);

		main_layer.draw();
	},

	markSelecteds() {
		SelectionMode._ids_map = {};
		SelectionMode._ids = {};

		for (const fam_pid in SelectionMode._items) {
			const item = SelectionMode._items[fam_pid];

			if (!item.selected) continue;

			var fam = fam_pid.split('_')[0];
            const pid = fam_pid.split('_')[1];

			if (!(fam in SelectionMode._ids_map)) {
				SelectionMode._ids_map[fam] = {}; // generations, key first - array later

				SelectionMode._ids[fam] = {};
			}
			SelectionMode._ids[fam][pid] = 1;

			//Hopefully these are at the same level with few discrepencies
			const generation = item.graphics.getY();

			SelectionMode._ids_map[fam][generation] = SelectionMode._ids_map[fam][generation] || [];
			SelectionMode._ids_map[fam][generation].push(pid);
		}

		for (var fam in SelectionMode._ids_map) {
			SelectionMode._ids_map[fam] = map2orderedArray(SelectionMode._ids_map[fam]);
		}
	},

	grabSelected() {
		SelectionMode._populateSelecteds();
		return SelectionMode;
	},

	selectFam(fam_id) {
		for (const key in SelectionMode._items) {
			if (key.split('_')[0] == fam_id) {
				SelectionMode._items[key].box.fire('click');
			}
		}
	},

	noneSelected() {
		return isEmpty(SelectionMode._ids);
	}
};
