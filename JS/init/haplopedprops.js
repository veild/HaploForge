const HaploPedProps = {
	xlinked: null,
	dominant: null,

	// Affecteds in each generation --> dominant
	// if males have one allele --> sexlinked (easy):
	//      if males have two alleles, but one of them is always zero --> sexlinked
	//
	// extra (unnecesary) checks:
	//      if dominant and male-to-male transmission --> autosomal
	//      if recessive and males are hemizygous and not all females are affected --> sexlinked

	// We assume that all pedigrees are on the same chromosome -- pick the largest to examine.

	init(hookfunc = null) {
		HaploPedProps.connectAll();

		// Genehunter can infer genders at this stage
		if (hookfunc !== null) {
			hookfunc();
		}

		HaploPedProps._populateGraphics(); /*Maybe doesn't need to be in this class, but MUST be after _connectAll */

		const fam_id = HaploPedProps._largestPedigree();

		HaploPedProps.dominant = HaploPedProps._determineDominant(fam_id);
		HaploPedProps.xlinked = HaploPedProps._determineXlinked(fam_id);

		if (HaploPedProps.xlinked) {
			HaploPedProps._correctAllMaleAlleles();
		}

		utility.notify(
			'Pedigree',
			`${HaploPedProps.xlinked ? 'X-Linked' : 'Autosomal'} ${HaploPedProps.dominant ? 'Dominant' : 'Recessive'}`
		);
	},

	connectAll: function connectAllIndividuals() {
		familyMapOps.foreachperc(function(id, famid, new_root) {
			//Assign father and mother to actual people
			let pers_father = 0,
				pers_mother = 0;

			if (new_root.father != 0) {
				pers_father = familyMapOps.getPerc(new_root.father, famid);

				new_root.father = pers_father; // Add father to child
				pers_father.addChild(new_root); // And child to father
			}

			if (new_root.mother != 0) {
				pers_mother = familyMapOps.getPerc(new_root.mother, famid);

				new_root.mother = pers_mother; // Add mother to child
				pers_mother.addChild(new_root); // And child to mother
			}

			if (pers_father != 0)
				if (pers_mother != 0)
					//Add parents as mates to each other
					pers_father.addMate(pers_mother);
				else pers_father.addMate(0);

			if (pers_mother != 0)
				if (pers_father != 0) pers_mother.addMate(pers_father);
				else pers_mother.addMate(0);
		});
	},

	_largestPedigree() {
		let max_memb = 0,
			max_fam = 0;

		familyMapOps.foreachfam(fid => {
			let num_memb = familyMapOps.numPercs(fid);

			if (num_memb > max_memb) {
				max_memb = num_memb;
				max_fam = fid;
			}
		});
		return max_fam;
	},

	_determineXlinked: function singleAlleleMale(fam_id) {
		let all_zero_Ychroms = 0;
		let num_males_checked = 0;

		let num_males_with_single_allele = 0;

		familyMapOps.foreachperc((perc_id, perc) => {
			let skip_uninformative = false;

			//Determine if Y allele is zero for ALL males (not just one)
			if (perc.gender == PED.MALE) {
				if (perc.haplo_data.length == 1) num_males_with_single_allele++;
				else {
					let num_all_zero_alleles = 0;

					for (let a = 0; a < perc.haplo_data.length; a++) {
						let all_zeroes = true;

						for (let i = 0; i < perc.haplo_data[a].data_array.length; i++) {
							if (perc.haplo_data[a].data_array[i] !== 0) {
								all_zeroes = false;
								break;
							}
						}
						if (all_zeroes) {
							num_all_zero_alleles++;
						}
					}
					if (num_all_zero_alleles === 2) {
						// skip this guy, completely uninformative
						skip_uninformative = true;
					} else {
						all_zero_Ychroms += num_all_zero_alleles;
					}
				}
				if (!skip_uninformative) {
					num_males_checked++;
				}
			}
		}, fam_id);

		if (num_males_with_single_allele === num_males_checked) {
			return true;
		}
		if (all_zero_Ychroms === num_males_checked) {
			return true;
		}
		if (num_males_with_single_allele + all_zero_Ychroms === num_males_checked) {
			return true;
		}

		return false;
	},

	_determineDominant: function checkAffectedsInGens(fam_id) {
        let affected_in_each_gen = 0;
        const num_gens = GlobalLevelGrid.numGens(fam_id);

        GlobalLevelGrid.foreachgeneration(fam_id, indivs_in_gen => {
            let affecteds_in_gen = 0;

            for (const perc_id of indivs_in_gen) {
                if (perc.affected === PED.AFFECTED) {
					affecteds_in_gen++;
				}
            }

            if (affecteds_in_gen > 0) {
				affected_in_each_gen++;
			}
        });

        return affected_in_each_gen === num_gens;
	},

	_correctAllMaleAlleles: function addZeroAllele_for_sexlinkedMales() {
		familyMapOps.foreachperc((pid, fid, perc) => {
			if (perc.gender === PED.MALE && perc.haplo_data.length === 1) {
				const len_of_allele = perc.haplo_data[0].data_array.length, new_allele = [];

				for (let i = 0; i < len_of_allele; i++) {
					new_allele.push(0);
				}

				perc.haplo_data.push(new Allele(new_allele));
			}
		});
	},

	_populateGraphics: function populateGrids_and_UniqueObjs() {
		console.groupCollapsed('Populate Graphics');

		//First root indiv for each family -- all members must be connected!
		familyMapOps.foreachfam(fam_id => {
            //Populate gridmap and uniq map
            const nodes_edges = new GraphicsLevelGrid(fam_id, null).getMap();
            const generation_array = GlobalLevelGrid.getGrid(fam_id);

            //		console.log( generation_array, uniq_objs);

            //Insert into global maps
            uniqueGraphOps.insertFam(fam_id, null);
            uniqueGraphOps.getFam(fam_id).nodes = nodes_edges.nodes;
            uniqueGraphOps.getFam(fam_id).edges = nodes_edges.edges;

            GlobalLevelGrid.updateGrid(fam_id, generation_array);

            // Check if root tree contains ALL individuals
            const num_peeps = familyMapOps.numPercs(fam_id); // skip 0 indiv

            let num_nodes = -1;

            for (const node in nodes_edges.nodes) {
				num_nodes++;
			}

            if (num_nodes !== num_peeps) {
				console.log(
					`[Warning] Family ${fam_id} has only mapped ${num_nodes} individuals out of ${num_peeps}`
				);

				// This is where we need to manually insert the
				//  other non-connected individuals

				familyMapOps.foreachperc((perc_id, perp) => {
					if (!(perc_id in nodes_edges.nodes)) {
						// Restore meta
						if (typeof perp.stored_meta !== 'undefined') {
							console.log('using stored meta', perc_id, perp.stored_meta);
							const meta = perp.stored_meta;

							uniqueGraphOps.insertNode(perc_id, fam_id, null);

							// This is complicated -- essentially the pedigree in haplo view and pedcreate have
							// different onclick functions, so I need to actually iterate through the pedigree
							// manually for each person and set their graphics that way.
							//  Basically ._populateGraphics only should apply to haploview mode and I need
							// to create my own way of parsing saved pedigrees.

							console.log('HERE', perp.stored_meta);
							delete perp.stored_meta;
						}
					}
				}, fam_id);
			}
        });
		console.groupEnd();
	}
};
