// TODO: Update node_map to point at unique_graph_obs.nodes, and retrieve family name

const edgeAccessor = {
	_UUID(type, from_id, to_id) {
		// m Father_id Mother_id   // MAYBE UNITE m and p?
		// p Father_id Mother_id
		// c parentline child_id

		// straightforward to find childline from two parents
		// (e.g any keys starting with "c m F_id M_id"
		return `${type}:${from_id}-${to_id}`;
	},

	childlineID(mateline_id, child_id) {
		return this._UUID('c', mateline_id, child_id);
	},

	matelineID(father_id, mother_id) {
		return this._UUID('m', father_id, mother_id);
	}
};

const updateGraph = {
	childline(family_id, person_id, parents_mateline_id = -1) {
		if (parents_mateline_id === -1) {
			const person_node = familyMapOps.getPerc(person_id, family_id);

			if (person_node.father === 0 || person_node.mother === 0) {
				//No parent mateline, nothing to update
				return 0;
			}

			parents_mateline_id = edgeAccessor.matelineID(person_node.father.id, person_node.mother.id);
		}

		const childline_id = edgeAccessor.childlineID(parents_mateline_id, person_id),
			childline = uniqueGraphOps.getEdge(childline_id, family_id).graphics,
			mateline = uniqueGraphOps.getEdge(parents_mateline_id, family_id).graphics,
			mateline_ps = mateline.getPoints();

		//			childline_ps = childline.getPoints();
		//			var mid_xx = childline_ps[0] + childline.getX(),
		//			  	mid_yy = childline_ps[1] + childline.getY();

		const mid_xx = (mateline_ps[2] + mateline_ps[4]) / 2 + mateline.getX(),
			  mid_yy = (mateline_ps[3] + mateline_ps[5]) / 2 + mateline.getY();

		const person_graphics = uniqueGraphOps.getNode(person_id, family_id).graphics;

		//		console.log("childline", childline);

		Graphics.Lines.changeRLine(childline, { x: mid_xx, y: mid_yy }, person_graphics.getPosition());
	}
};

function redrawNodes(pers_id, fam_id, drawLinesToo) {
	const pers = familyMapOps.getPerc(pers_id, fam_id),
		  fam_gfx = uniqueGraphOps.getFam(fam_id),
		  node_map = fam_gfx.nodes,
		  edge_map = fam_gfx.edges,
		  npers = node_map[pers_id],
		  npers_pos = npers.graphics.getPosition(),
		  per_isMale = pers.gender == PED.MALE;

	// Move mates vertically

	// Stagger mate's vertically to please the world
	const staggerY_amount = grid_rezY / 2,
		  use_stagger = false; //pers.mates.length > 1;

		//		console.log(pers_id, "mate=", pers.mates[m].id )
	for (const mate of pers.mates) {
		const nmate = node_map[mate.id].graphics;
		let nmate_pos = nmate.getPosition();

		if (use_stagger) {
			nmate.setY(npers_pos.y + staggerY_amount); // bind y only
		} else {
			nmate.setY(npers_pos.y);
		}

		const ch_x = npers_pos.x + nodeSize * 2; // Offset stops shapes from intersecting

		//Mate is on left
		if (ch_x > nmate_pos.x) {
			if (ch_x - nmate_pos.x < horiz_space) {
				nmate.setX(ch_x - horiz_space);
			}

			nmate_pos = nmate.getPosition(); // update pos after change

			// -- Keep this out, otherwise you can never swap around parents
			//		else
			//			if ((nmate_pos.x-npers_pos.x) < buffer)
			//				nmate.setX(npers_pos.x + buffer+2);
		}
		//Update mate's mate's
		for (var mm = 0; mm < mate.mates.length; mm++) {
			var matemate_id = mate.mates[mm].id;

			if (matemate_id != pers_id) {
				const nmatemate = node_map[matemate_id].graphics;
				let nmatemate_pos = nmatemate.getPosition();

				nmatemate.setY(npers_pos.y);
				nmatemate_pos = nmatemate.getPosition(); // update
			}
		}

		if (drawLinesToo) {
			var male_id = per_isMale ? pers.id : mate.id,
				female_id = per_isMale ? mate.id : pers.id;

			// -- mateline, and update it's pos
			var mateline_id = edgeAccessor.matelineID(male_id, female_id),
				mateline = edge_map[mateline_id].graphics;

			const s1_x = npers_pos.x,
				  s1_y = npers_pos.y,
				  e1_x = nmate_pos.x,
				  e1_y = nmate_pos.y;

			Graphics.Lines.changeRLineHoriz(mateline, npers_pos, nmate_pos);

			//  -- update childlines attached to it
			const childkey_starting = 'c:' + mateline_id; //Look for all childnodes starting with

			for (const key in edge_map) {
				if (key.lastIndexOf(childkey_starting, 0) === 0) {
					//startsWith implementation
					const find_child_id = key.split('-');

					var child_id = parseInt(find_child_id[find_child_id.length - 1].trim());

					updateGraph.childline(fam_id, child_id);
				}
			}

			// -- mate's childline
			updateGraph.childline(fam_id, mate.id);

			// -- mate's mate's mateline
			for (var mm = 0; mm < mate.mates.length; mm++) {
				const matemate_id = mate.mates[mm].id,
					matemate_gfx = node_map[matemate_id].graphics;

				var male_id = mate.gender === PED.MALE ? mate.id : matemate_id,
					female_id = mate.gender === PED.FEMALE ? mate.id : matemate_id;

				if (matemate_id != pers_id) {
					var mateline_id = edgeAccessor.matelineID(male_id, female_id),
						mateline = edge_map[mateline_id].graphics;

					//					var s1_x = mate.getX(), 	s1_y = mate.getY(),
					//						e1_x = matemate.getX(), e1_y = matemate.getY();

					Graphics.Lines.changeRLineHoriz(mateline, nmate.getPosition(), matemate_gfx.getPosition());

					// And now their children...!
					const child_edges = uniqueGraphOps.findAllOffspringEdges(fam_id, male_id, female_id);

					for (let cc = 0; cc < child_edges.length; cc++) {
						const ops = child_edges[cc].split('-');
						var child_id = ops[ops.length - 1];

						updateGraph.childline(fam_id, child_id);
					}
				}
			}
		}
	}

	// NEED TO UPDATE GENERATION)GRID_IDS

	//If last generation, move all sibs
	if (GlobalLevelGrid.exists(fam_id)) {
		const last_gen = GlobalLevelGrid.getlastgeneration(fam_id);

		if (last_gen.indexOf(pers_id) !== -1) {
			for (const sib_id of last_gen) {
				const n_sib = node_map[sib_id].graphics;

				n_sib.setY(npers_pos.y);

				if (drawLinesToo) {
					//Update childlines
					updateGraph.childline(fam_id, sib_id);
				}
			}
		}
	}

	//Update own childnode.
	if (drawLinesToo && (pers.father != 0 && pers.mother != 0)) {
		updateGraph.childline(fam_id, pers.id);
	}
}

// Performs redrawNodes upon all
function touchlines() {
	familyMapOps.foreachperc((perid, famid) => {
		//console.log("touch", perid, famid);

		const e = new CustomEvent('dragmove', { target: { attrs: { x: 10, y: 10 } } }),
			  o = uniqueGraphOps.getFam(famid).nodes[perid].graphics;

		o.dispatchEvent(e);
	});
}

function linesShow(fid, show) {
	//Hide lines
	const edges = uniqueGraphOps.getFam(fid).edges;
	for (const eid in edges)
		if (show) {
			edges[eid].graphics.show();
			edges[eid].graphics.setZIndex(-21);
		} else edges[eid].graphics.hide();

	main_layer.draw();
}
