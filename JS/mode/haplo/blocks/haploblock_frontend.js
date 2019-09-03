//const htext = null; // DEBUG

const HaploBlock = {
	sta_index: 0,
	end_index: 0,

	haploinfos: null, // what addHaploBlocksAll uses

	/* Called once - displays multiple individuals across any family */
	init(haplofam_map, parent_node) {
		HaploBlock.haploinfos = []; //clean

		HaploBlock.sta_index = 0;
		HaploBlock.end_index = Resize.numVisibleHaplos;

		const position_by_xpos = {};

		for (const fid in haplofam_map) {
			const fam_x = uniqueGraphOps.getFam(fid).group.getX();

			for (const pid in haplofam_map[fid]) {
				const pers_x = uniqueGraphOps.getNode(pid, fid).graphics.getX() + fam_x,
					  pers_hp = familyMapOps.getPerc(pid, fid).haplo_data;

				//haploinfos.push(pers_hp);
				if (pers_x in position_by_xpos) {
					console.log('ERROR, duplicate position!');
					continue;
				}
				position_by_xpos[pers_x] = { fam: fid, per: pid, data: pers_hp };
			}
		}

		const sorted_positions = Object.keys(position_by_xpos);
		sorted_positions.sort((a, b) => Number(a) - Number(b));

		for (const key of sorted_positions) {
			HaploBlock.haploinfos.push(position_by_xpos[key].data);
		}

		SliderHandler.inputsLocked = true;
		HaploBlock.redrawHaplos(true);
	},

	/* Redraws the current haplodata_arr group, regardless of who they are*/
	redrawHaplos(resizeToo) {
		if (resizeToo) {
			Resize.resizeCanvas();
		}

		const scroll_rect = HaploWindow._bottom,
			  scroll_area = HaploWindow._scroll_area;

		const diff_y = scroll_rect.getAbsolutePosition().y - scroll_area.getAbsolutePosition().y,
			  index_start_delta = Math.floor(diff_y / HAP_VERT_SPA);

		//console.log("diffy="+diff_y, "ind_start_d="+index_start_delta);
		HaploBlock.sta_index += index_start_delta;
		HaploBlock.end_index += index_start_delta;
		//console.log("shifting by "+index_start_delta, sta_index, end_index);

		// Update marker background height
		HaploWindow._left.setY(HaploWindow._bottom.rect.getAbsolutePosition().y);
		HaploWindow._left.setHeight(HaploWindow._bottom.rect.getHeight());

		// Delete after grabbing position
		scroll_area.destroyChildren();
		scroll_area.setY(0);

		// console.log("indexes = ", sta_index, end_index);

		if (HaploBlock.sta_index < 0) {
			HaploBlock.sta_index = 0;
			HaploBlock.end_index = HAP_DRAW_LIM;
		}
		if (HaploBlock.end_index > MarkerData.getLength() - 1) {
			HaploBlock.end_index = MarkerData.getLength() - 1;
			HaploBlock.sta_index = HaploBlock.end_index - HAP_DRAW_LIM;
		}

		const new_haplos = HaploBlock.__addHaploBlocksAll();
		scroll_area.add(new_haplos);

		if (HomologyPlot.rendered_filtered_plot !== null && HomologyPlot.rendered_filtered_plot.length > 0) {
			const homology_overlays = HomologyPlot.addHomologyPlotOverlay();
			scroll_area.add(homology_overlays);
		}

		scroll_area.parent.show();
		haplo_layer.draw();
	},

	__addHaploBlocksAll() {
		const grp = new Kinetic.Group({ x: -50, y: 2 * nodeSize + 10 });

		const haplo = new Kinetic.Group({});

		//Process blocks
		for (let q = 0; q < HaploBlock.haploinfos.length; q++) {
			for (let j = 0; j < 2; j++) {
				const one_hgroup = HaploBlock.haploinfos[q][j].haplogroup_array;

				let ind = HaploBlock.sta_index;
				while (ind <= HaploBlock.end_index) {
					let iter = ind; // start of block
					const color_group = one_hgroup[iter];

					while (one_hgroup[++iter] === color_group && iter <= HaploBlock.end_index) {}

					const rec = new Kinetic.Rect(HaploBlockFormat.format.blockprops);

					rec.attrs.y = (ind - HaploBlock.sta_index - 2) * HAP_VERT_SPA;
					rec.attrs.height = (iter - ind) * HAP_VERT_SPA;
					rec.attrs.fill = FounderColor.unique[color_group];
					rec.attrs.x =
						haploblock_spacers.marker_offset_px +
						(q * haploblock_spacers.person_offset_px + j * haploblock_spacers.block_offset_px);

					haplo.add(rec);
					ind = iter;
				}
			}
			// For seeing the alignment

			// 		haplo.add( new Kinetic.Line({
			// 			x: (
			// 				haploblock_spacers.marker_offset_px
			// 				+ (q* haploblock_spacers.person_offset_px)
			// 				+ haploblock_spacers.block_width_px
			// 				+ 1),
			// 			y: -200,
			// 			points: [0,0,0,1000],
			// 			strokeWidth:1,
			// 			stroke:'red'
			// 		}));
		}
		grp.add(haplo);

		// Text
		let total_text = '';
		for (let m = HaploBlock.sta_index; m <= HaploBlock.end_index; m++) {
			total_text += MarkerData.padded[m] + haploblock_buffers.marker_offset;

			for (let i = 0; i < HaploBlock.haploinfos.length; i++)
				total_text +=
					haploblock_buffers.ht_offset +
					HaploBlock.haploinfos[i][0].data_array[m] +
					haploblock_buffers.ht_2_ht +
					HaploBlock.haploinfos[i][1].data_array[m];
			total_text += '\n';
		}

		HaploBlockFormat.format.textprops.text = total_text;
		const texter = new Kinetic.Text(HaploBlockFormat.format.textprops);

		//htext = texter;
		grp.add(texter);
		return grp;
	},

	__indexOfNextRecomb(reverse = false) {
		const working_array = {};

		let curr_i = reverse ? HaploBlock.sta_index : HaploBlock.end_index;
		while (true) {
			if (reverse) {
				curr_i--;
				if (curr_i < 0) {
					return 0;
				}
			} else {
				curr_i++;
				const last = MarkerData.getLength() - 1;
				if (curr_i > last) {
					return last;
				}
			}

			const hap_len = HaploBlock.haploinfos.length;
			for (let p = 0; p < hap_len; p++) {
				const perc = HaploBlock.haploinfos[p];
				const per_len = perc.length;
				for (let a = 0; a < per_len; a++) {
					const haplo_array = perc[a].haplogroup_array,
						  map_index = p * hap_len + a * per_len;

					const current_col = haplo_array[curr_i];
					if (current_col === FounderColor.zero_color_grp) {
						continue;
					}

					if (map_index in working_array) {
						const prev_col = working_array[map_index];

						if (current_col !== prev_col) {
							return curr_i;
						}
					}
					working_array[map_index] = current_col;
				}
			}
		}
		return -1;
	},

	// Better to have to seperate function for forward and back
	// so that onclick events don't pass the evt as first paremeter instead.
	__scrollRecomb(reverse) {
		const diff = HaploBlock.end_index - HaploBlock.sta_index;
		const recomb = HaploBlock.__indexOfNextRecomb(reverse);

		if (recomb === -1) {
			return -1;
		}

		HaploBlock.sta_index = recomb - parseInt(diff / 2);
		HaploBlock.end_index = HaploBlock.sta_index + diff;

		HaploModeEvents.moveHaplotypes();
	},

	scrollToPrevRecomb() {
		HaploBlock.__scrollRecomb(true);
	},
	scrollToNextRecomb() {
		HaploBlock.__scrollRecomb(false);
	}
};
