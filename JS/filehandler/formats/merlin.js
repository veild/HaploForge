const debugMerlin = {};

class Merlin extends FileFormat {
	constructor(mode_init = null) {
		const haplo = {
			id: 'merlin_haplo',
			process(haplo_text) {
				debugMerlin.haplo = haplo_text;
				Merlin.populateFamilyAndHaploMap(haplo_text);
			},
			hasMarkerNames: false,
			inferGenders: true
		};

		const descent = {
			id: 'merlin_descent',
			process(descent_text) {
				debugMerlin.descent = descent_text;
				Merlin.populateFlow(descent_text);
			},
			resolver_mode: AssignHGroups.resolvers.FLOW
		};

		const map = {
			id: 'merlin_map',
			process: Merlin.populateMarkerMap
		};

		const pedin = {
			id: 'merlin_ped',
			process: FileFormat.updateFamily
		};

		super(haplo, map, pedin, descent, mode_init);
	}

	static populateFlow(text_unformatted) {
		Merlin.populateFamilyAndHaploMap(text_unformatted, true);
	}

	static populateFamilyAndHaploMap(text_unformatted, flow = false) {
        //console.log("::"+(flow?"Flow":"Chr")+" --- start");

        const lines = text_unformatted.split('\n');

        const tmp = {
			_fam: null,
			_perc_array: [], // horizontal percs
			_alleles_array: [] // vertical haplos [ [[],[]] , [[],[]] ]
		};

        function flushTmpData(tmp) {
			// Finish populating alleles and insert percs
			if (tmp._perc_array.length > 0) {
				if (tmp._perc_array.length !== tmp._alleles_array.length) {
					console.log('Length mismatch');
					throw new Error('');
				}

				for (let tpa = 0; tpa < tmp._perc_array.length; tpa++) {
                    const perc_alleles = tmp._alleles_array[tpa];
                    var perc = tmp._perc_array[tpa];

                    if (flow) {
						// flow relies on prior perc existence
						var perc = familyMapOps.getPerc(perc.id, tmp._fam);
						perc.insertFlowData(perc_alleles[0]);
						perc.insertFlowData(perc_alleles[1]);
						//console.log("INSERTING FLOW", perc.id, perc.haplo_data[0].flow);
					} else {
						perc.insertHaploData(perc_alleles[0]);
						perc.insertHaploData(perc_alleles[1]);
						familyMapOps.insertPerc(perc, Number(tmp._fam));
					}
                }

				tmp._perc_array = [];
				tmp._alleles_array = [];
			}
		}

        // Populate Marker
        for (const line of lines) {
            if (line.startsWith('FAMILY')) {
				flushTmpData(tmp);

				const fid = line.split(/\s+/)[1];
				tmp._fam = Number(fid);
				continue;
			}

            if (tmp._perc_array.length === 0) {
				// Hunt for names
				if (line.indexOf('(') !== -1 && line.indexOf(')') !== -1) {
					const people = line.trim().split(/\s{2,}/);

					for (let p = 0; p < people.length; p++) {
                        const perc = people[p].split(' ');

                        const id = Number(perc[0]);
                        let parents = perc[1].split('(')[1].split(')')[0];

                        let mother_id = 0, father_id = 0;

                        if (parents !== 'F') {
							parents = parents.split(',').map((x) => Number(x));

							mother_id = parents[0];
							father_id = parents[1];
						}

                        // Gender's and Affecteds are unknown.
                        // Gender's can be inferred, but affectation needs a ped file
                        const newp = new Person(id, 0, 0, mother_id, father_id);
                        tmp._perc_array.push(newp);
                        tmp._alleles_array.push([ [], [] ]);
                    }
				}
				continue;
			}

            const trimmed = line.trim();
            if (trimmed.length == 0) {
				flushTmpData(tmp);
				continue;
			}

            // Allele lines
            const multiple_alleles = trimmed.split(/\s{3,}/);

            if (multiple_alleles.length !== tmp._perc_array.length) {
				console.log(trimmed, multiple_alleles, tmp._perc_array);
				throw new Error('Num alleles and num percs do not align');
			}

            for (let a = 0; a < multiple_alleles.length; a++) {
				const alleles = multiple_alleles[a],
                let left_right = null;

                if (!flow) {
					// We ignore all types of phasing and for
					// ambiguously marker alleles "A", we pick the
					// first (this holds consistent for inherited).
					//var left_right = alleles.split(/\s[+:|\\/]\s/)

					left_right = alleles.split(/\s[^\d]\s/).map((x) =>
						Number(
							x.split(',')[0].replace('A', '')
							//.replace("?","9")
						)
					);
				} else {
					left_right = alleles.split(/\s[^\d]\s/);
					FlowResolver.convertGroupsToFamilySpecific(left_right, tmp._fam);
				}

                tmp._alleles_array[a][0].push(left_right[0]);
                tmp._alleles_array[a][1].push(left_right[1]);
            }
        }

        flushTmpData(tmp);

        //console.log("::"+(flow?"Flow":"Chr")+" --- finish");
    }

	static populateMarkerMap(text_unformatted) {
		//console.log("::Map --- start");

		debugMerlin.map = text_unformatted;

		const lines = text_unformatted.split('\n');

		const markers = [], genepos = [];

		for (let l = 1; l < lines.length; l++) {
			// skip headers

			const line = lines[l].trim();

			if (line === '') {
				continue;
			}

			const chr_genpos_marker = line.split(/\s+/);

			//console.log(chr_genpos_marker, chr_genpos_marker.length, line);
			markers.push(chr_genpos_marker[2].trim());
			genepos.push(Number(chr_genpos_marker[1]));
		}

		MarkerData.addMarkers(markers);
		MarkerData.addGenePos(genepos);

		//console.log("::Map --- finish");
	}
}
