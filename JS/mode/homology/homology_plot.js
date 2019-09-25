const HomologyPlot = {
	plots: null, // valid: HOM, HET, CHET, family_specific.{HOM,HET,CHET}
	rendered_filtered_plot: null,
	rendered_filtered_plot_max: 0,

	_type: 'HOM',

	debugUpdatePlots(spec_plot, stretch, score) {
		HomologyPlot.plotScoresOnMarkerScale(spec_plot, stretch, score);
	},

	printToFile(ht_ids, start_index = 0, stop_index = MarkerData.rs_array.length - 1) {
		const padding_marker = '            ',
			  padding_score = '     ',
			  padding_names = '       ',
			  padding_leftmost = padding_names.slice(-(padding_names.length - 1)); // must be one less than padding_names

		// TOP LINE
		// Family names
		const families_encountered = {};

		for (var i = 0; i < ht_ids.length; i++) {
			var f_id = ht_ids[i],
				fid = f_id.split('_')[0];

			if (!(fid in families_encountered)) {
				families_encountered[fid] = [];
			}
			families_encountered[fid].push(f_id);
		}

		let text = padding_marker;

		// Print names, get their ordering
		const ordering = {};
		const order_index = [];

		for (var fid in families_encountered) {
			num_indivs = families_encountered[fid].length;
			let padding_fam = '';
			for (let n = 0; n < num_indivs; n++) {
				const f_id = families_encountered[fid][n];
				var index = ht_ids.indexOf(f_id);

				ordering[index] = f_id;
				order_index.push(index);

				padding_fam += padding_names;
			}

			text += fid.toString().center(`|${padding_fam.slice(0, padding_fam.length - 1)}`); //'|' + padding_fam.slice(0, padding_fam.length - 1));
		}
		// second pass for family totals
		for (var fid in families_encountered) {
			const name = `Scores ${fid}`;

			var padding_total = padding_score + padding_score + padding_score;
			text += name.center(`|${padding_total.slice(0, padding_total.length - 1)}`);
		}

		var padding_total = padding_score + padding_score + padding_score;
		text += 'Global totals'.center(`|${padding_total.slice(0, padding_total.length - 1)}`);
		text += '|\n';

		// SECOND LINE
		// Individuals names, family totals, global totals
		text += padding_marker;
		let tmp_fam = -1;
		for (let o = 0; o < order_index.length; o++) {
			let index = order_index[o];
			let fid = ordering[index];

            const f_id = fid.split('_');
            fid = f_id[0];
            var id = f_id[1];

            const aff = familyMapOps.getPerc(id, fid).affected == PED.AFFECTED ? 'a' : 'u';

            if (tmp_fam != fid) {
				tmp_fam = fid;
				text += (`${id.toString()}_${aff}`).center(`|${padding_names.slice(0, padding_names.length - 1)}`);
			} else {
				text += (`${id.toString()}_${aff}`).center(padding_names);
			}
        }

		for (var fid in families_encountered) {
			text += `|${'Hom'.paddingLeft(padding_score.slice(0, padding_score.length - 1))}`;
			text += 'Het'.paddingLeft(padding_score);
			text += 'Chet'.paddingLeft(padding_score);
		}

		text += `|${'Hom'.paddingLeft(padding_score.slice(0, padding_score.length - 1))}`;
		text += 'Het'.paddingLeft(padding_score);
		text += `${'Chet'.paddingLeft(padding_score)}|`;
		text += '\n';

		// DATA LINES
		// Marker, GTs, fam scores, total score

		const fam_hom_v = HomologyPlot.plots.family_specific.HOM,
			  fam_het_v = HomologyPlot.plots.family_specific.HET,
			  fam_chet_v = HomologyPlot.plots.family_specific.CHET;

		const hom_v = HomologyPlot.plots.HOM,
			  het_v = HomologyPlot.plots.HET,
			  chet_v = HomologyPlot.plots.CHET;

		for (let l = start_index; l <= stop_index; l++) {
			const marker = MarkerData.rs_array[l];
			text += marker.paddingLeft(padding_marker);

			for (var i = 0; i < order_index.length; i++) {
				var f_id = ht_ids[order_index[i]].split('_'),
					fid = f_id[0],
					id = f_id[1];

				const alleles = familyMapOps.getPerc(id, fid).haplo_data,
					  a1 = alleles[0].data_array[l],
					  a2 = alleles[1].data_array[l];

					  text += (`${a1.toString()}${a2.toString()}`).center(padding_names);
			}

			//console.log(HomologyPlot.plots.family_specific);

			for (var fid in families_encountered) {
				text += fam_hom_v[fid][l].toString().center(padding_score);
				text += fam_het_v[fid][l].toString().center(padding_score);
				text += fam_chet_v[fid][l].toString().center(padding_score);
			}

			text += hom_v[l].toString().center(padding_score);
			text += het_v[l].toString().center(padding_score);
			text += chet_v[l].toString().center(padding_score);

			//var score_columns = '\t ' + hom_v.toString() + '\t ' + het_v.toString() + '\t ' + chet_v.toString();
			//score_columns = score_columns.replace(/ -/g, "-");

			text += '\n';
		}
		// Write
		exportToTab(text);
	},

	removeScores(redrawtoo = true) {
		if (MarkerSlider._instance !== null && MarkerSlider._instance.plotline !== undefined) {
			MarkerSlider._instance.plotline.destroy();
			//haplo_layer.draw();
			//debugger
		}
		HomologyPlot.rendered_filtered_plot = null;

		if (redrawtoo) {
			HaploBlock.redrawHaplos();
			//haplo_layer.draw();
		}
	},

	plotScoresOnMarkerScale(specific_plot, stretch, score) {
		/* Grab rangeline and hang graphics from it.

		 Shape likely to be > 1000 px tall, and rangeline only 300 px,
		 which is a scale down of 3x that most pc's can handle
		 ~~~ hopefully Kinetic/canvas mipmaps efficiently
		     so I don't have to ~~~
		*/

		MarkerSlider.makeVisible(true);

		const marker_scale = MarkerSlider._instance,
			  rangeline = marker_scale.rangeline,
			  r_points = rangeline.getPoints(),
			  r_height = r_points[3] - r_points[1],
			  plen = specific_plot.length;

		HomologyPlot.removeScores(false);

		const point_and_max = HomologyPlot.plotAxis4(specific_plot, stretch, score);

		const inform_points = point_and_max.plot,
			  points_max = point_and_max.max;

		// Insert [0,0] at the start
		inform_points.splice(0, 0, 0);
		inform_points.splice(0, 0, 0);

		HomologyPlot.rendered_filtered_plot = inform_points;
		HomologyPlot.rendered_filtered_plot_max = points_max;

		const infline = new Kinetic.Line({
			x: rangeline.getX(),
			y: rangeline.getY(),
			points: inform_points,
			stroke: 'blue',
			strokeWidth: 0.3,
			closed: true,
			fill: 'blue',
			alpha: 0.3
		});

		infline.scaleY(r_height / plen);
		infline.scaleX(50 / points_max);

		marker_scale.plotline = infline;

		marker_scale.add(marker_scale.plotline);
		marker_scale.plotline.setZIndex(-99);

		HaploBlock.redrawHaplos();
	},

	/* path finding over the entire plot, instead of slwindow*/
	plotAxis4(given_plot, stretch_min, score_min) {
		// Notes: Plot is just score, this is NOT xy data
		//
		// 1. Apply score filter
		const score_filter_plot = given_plot.map((x) => (x >= score_min ? x : 0)),
			  tmp_plot = score_filter_plot;

		//console.log(given_plot)
		//console.log(tmp_plot)

		//
		//
		// 2. Crawl over plot to find stretches
		let current_stretch = 0;

		const plen = tmp_plot.length;
		var p = 0; // lookahead_base

		const new_plot = [];

		while (p++ < plen) {
			if (tmp_plot[p] === 0) {
				// End an ongoing search
				if (current_stretch >= stretch_min) {
					// qualifies, copy over results
					for (var q = p - (current_stretch + 1); q++ < p; ) {
						new_plot[q] = tmp_plot[q];
					}
				}
				// Regardless, reset counter
				current_stretch = 0;
			} else {
				// Copy over NOTHING HERE -- happens retrospectively
				current_stretch++;
			}
		}

		// Check if still qualifies at end
		if (current_stretch >= stretch_min) {
			for (var q = p - (current_stretch + 1); q++ < p; ) {
				new_plot[q] = tmp_plot[q];
			}
		}

		// Fill in blanks, and convert to XY plot
		const return_xy = [];

		let max_score = -1;

		for (var p = 0; p++ < plen; ) {
			new_plot[p] = new_plot[p] || 0;

			if (new_plot[p] < 0) {
				new_plot[p] = 0;
			} else if (new_plot[p] > max_score) {
				max_score = new_plot[p];
			}

			return_xy.push(new_plot[p], p);
		}
		return { plot: return_xy, max: max_score };
	},

	// Over(under?)lays the haploblocks rendered if the
	// homology mode is active/present.
	addHomologyPlotOverlay() {
		// Note: Due to [x,y,x,y] specs, this is DOUBLE the marker length
		const current_specific_plot = HomologyPlot.rendered_filtered_plot;
		const npoints = [ 0, 0 ];

		let count = 1;

		const white_rect_right = HaploWindow._bottom.rect.getWidth() + HaploWindow._bottom.rect.getAbsolutePosition().x;
		const scale = white_rect_right / HomologyPlot.rendered_filtered_plot_max;

		for (let i = HaploBlock.sta_index; i <= HaploBlock.end_index; i++) {
			const x_coord = current_specific_plot[i * 2],
				  y_coord = current_specific_plot[i * 2 + 1];

			const score_coord = x_coord < 0 ? 0 : x_coord * scale;

			const y_initial = count * HAP_VERT_SPA,
				  y_next = (count + 1) * HAP_VERT_SPA;

			npoints.push(score_coord, y_initial);
			npoints.push(score_coord, y_next);

			// It may seem like regions overlap over subsequent iterations,
			// but bear in mind that they do so at different score positions.
			count++;
		}
		npoints.push(0, count * HAP_VERT_SPA);

		return (line = new Kinetic.Line({
			x: -haploblock_spacers.marker_offset_px - 20,
			y: 0,
			stroke: 'red',
			strokeWidth: 1,
			closed: true,
			fill: 'red',
			opacity: 0.3,
			points: npoints
		}));
	}
};
