const SubSelectLevel = {
	/* The naive approach would be to use the existing LevelGrid to
   determine DOS between individuals, but we would still need
   to determine whether said individuals are related, meaning
   recursing through parents would still be required and we can
   calculate DOS from that alone.

   The better approach -- (1) For each individual
*/
	function(selection_map) {
		// Grab level grids for each family member

		for (const fam in selection_map) {
			const fam_grid = GlobalLevelGrid.getGrid(fam);

			for (
				let g = 0;
				g < selection_map[fam].length;
				g++ // gen
			) {
				for (
					let i = 0;
					i < selection_map[fam][g].length;
					i++ // indiv
				) {
					const indiv = selection_map[fam][g][i];
					if (indiv.id) {
					}
				}
			}
		}
	}
};

function findDOSinSelection(selection_map) {
	console.log(selection_map);

	// Replace this as the main argument, if generations are not needed....
	const selection_map_map = {}; // This is an actual map, no generations

	for (var fam in selection_map) {
		selection_map_map[fam] = {};
		for (var g = 0; g < selection_map[fam].length; g++) {
			for (var i = 0; i < selection_map[fam][g].length; i++) {
				const indiv_id = selection_map[fam][g][i];
				selection_map_map[fam][indiv_id] = 1;
			}
		}
	}

	const fam_lines = {}; // sib_map for each family, holds total lines to be drawn.

	for (var fam in selection_map) {
		const num_diff_gens = selection_map[fam].length - 1;

		const sib_map = {}; //stores line data for each sibgroup, regardless of generation

		for (var g = num_diff_gens; g >= 0; g--) {
			const current_gen = selection_map[fam][g];

			// 1. Make sib groups
			const sib_groups = {}; // indivs sharing same immediate parents

			for (const id of current_gen) {
                var perc = familyMapOps.getPerc(id, fam);

                // Only Non-founders can be sibs
                let fm_key;
                if (perc.father !== 0) {
					fm_key = `${perc.father.id}_${perc.mother.id}`;
				} else {
					//Founders are in their own sibgroups
					fm_key = perc.id;
				}
				sib_groups[fm_key] = sib_groups[fm_key] || [];
				sib_groups[fm_key].push(perc);
			}

			//			console.log("sib_groups", sib_groups);

			// if (g === 0) continue;
			// Don't need to scan up if no higher order members are selected

			// 2. Recurse up for relations
			for (const sgr in sib_groups) {
				var perc = sib_groups[sgr][0]; // only need first in each parental group
				const root = perc;

				// Maps to reduce duplicate lines
				const matelines = {},
					  directlines = {};
				// siblines = []; // not needed, there's only one

				// Populates matelines and directlines, does not return anything.
				const search = function recurseParents(root, level) {
					if (root === 0) return -1;

					if (root.id !== perc.id) {
						if (root.id in selection_map_map[fam]) {
							return {
								id: root.id,
								dos: level
							};
						}
					}

					const moth_rez = recurseParents(root.mother, level + 1),
						  fath_rez = recurseParents(root.father, level + 1);

					if (moth_rez !== -1 && fath_rez !== -1) {
						let are_mates = false;

						//If the connected at the same level, then check if they're mates.
						if (moth_rez.dos === fath_rez.dos) {
							const moth_perc = familyMapOps.getPerc(moth_rez.id, fam);

							for (let m = 0; m < moth_perc.mates.length; m++) {
								if (fath_rez.id === moth_perc.mates[m].id) {
									are_mates = true;
									break;
								}
							}
						}

						if (are_mates) {
							// Push as a single connection
							//							console.log("adding mateline for", root.id)
							matelines[`${fath_rez.id}_${moth_rez.id}`] = moth_rez.dos;
						} else {
							const link_found = false;

							// Are they connected at another level?
							let lower_dos_obj, higher_dos_obj;

							if (moth_rez.dos < fath_rez.dos) {
								lower_dos_obj = moth_rez;
								higher_dos_obj = fath_rez;
							} else {
								lower_dos_obj = fath_rez;
								higher_dos_obj = moth_rez;
							}

							//Check if higher_dos_obj is linked to lower_one

							if (!link_found) {
								// No link - Push as seperate connectors
								directlines[moth_rez.id] = moth_rez.dos;
								directlines[fath_rez.id] = fath_rez.dos;
							}
						}
					} else if (moth_rez !== -1) directlines[moth_rez.id] = moth_rez.dos;
					else if (fath_rez !== -1) directlines[fath_rez.id] = fath_rez.dos;

					// console.groupEnd();
					return -1;
				};

				search(root, 0);

				//				console.log("sib_groups[sgr]", sib_groups[sgr]);

				if (!(g in sib_map)) {
					sib_map[g] = {};
				}

				let sib_key = sib_groups[sgr][0].id;

				// Add the others if more than one sibs in group
				if (!(sib_groups[sgr].length === 1)) {
					for (var i = 1; i < sib_groups[sgr].length; i++) {
						sib_key += `_${sib_groups[sgr][i].id}`;
					}
				}

				// if (!( isEmpty(matelines) && isEmpty(directlines))){
				sib_map[g][sib_key] = {
					matelines: matelines,
					directlines: directlines
				};
				// }
			}

			// Essentially map2OrderedArray, but nested version
			// -- only occurence here
			const sib_map2 = [];
			for (const k in sib_map) {
				let empty = true;
				for (const kk in sib_map[k]) {
					if (!isEmpty(sib_map[k][kk])) {
						empty = false;
						break;
					}
				}
				if (!empty) sib_map2.push(sib_map[k]);
			}

			fam_lines[fam] = sib_map2;
		}
	}
	//	console.log("fam_lines", fam_lines)

	// If an indiv exists

	return fam_lines;
}
