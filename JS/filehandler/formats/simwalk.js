class Simwalk extends FileFormat {
	constructor(mode_init = null) {
		const use_descent = document.getElementById('sw_infer_box').checked;

		console.log('use descent', use_descent);

		const haplo = {
			id: 'sw_haplo',
			process(haplo_text) {
				Simwalk.populateFamHaploAndDesc(haplo_text, use_descent);
			},
			useDescent: use_descent,
			resolver_mode: AssignHGroups.resolvers.DESCENT, //only used if use_descent true
			hasMarkerNames: true
		};

		// Simwalk HEF files have rs and gp marker data, as well as ped and haplo
		super(haplo, null, null, null, mode_init);
	}

	static populateFamHaploAndDesc(text_unformatted, use_descent = false) {
		const lines = text_unformatted.split('\n');

		let marker_header_found = false,
			pedname_header_found = false;

		// Populate Marker
		const markers = [],
			genepos = [];

		for (let line of lines) {
			// console.log(line)

			if (line.startsWith('Marker')) {
				//console.log("found marker line")
				marker_header_found = true;
				continue;
			}

			if (line.startsWith('Pedigree Name')) {
				//console.log("found pedigree line")
				pedname_header_found = true;
				break;
			}

			if (marker_header_found) {
				if (!pedname_header_found) {
					if (!line.startsWith(' ')) {
						// console.log("found marker line!", line);
						const markerdata = line.split(/\s+/);
						markers.push(markerdata[0].trim());
						genepos.push(Number(markerdata[1]));
					}
				}
			}
		}

		MarkerData.addMarkers(markers);
		MarkerData.addGenePos(genepos);

		// console.log("finished marker data");

		//Ped Name
		let dashedlines_found = false;

		const tmp = {
			_fam: null,
			_perc: null,
			_allpat: [], // alleles
			_allmat: [],
			_decpat: [], // descent
			_decmat: []
		};

		function insertDat(tmp) {
			if (tmp._allpat.length > 0) {
				// console.log("appending haplo data to", tmp_perc.id)
				tmp._perc.insertHaploData(tmp._allpat);
				tmp._perc.insertHaploData(tmp._allmat);

				if (use_descent) {
					//					console.log("use_descent", tmp_decpat, tmp_decmat);
					tmp._perc.insertDescentData(tmp._decpat); // paternal first
					tmp._perc.insertDescentData(tmp._decmat); // maternal second
				}

				tmp._perc = null;
				tmp._allmat = [];
				tmp._allpat = [];
				tmp._decpat = [];
				tmp._decmat = [];
			}
		}

		for (let line of lines) {
			if (line.startsWith('________')) {
				// Flush data from last perc if new fam found
				if (tmp._perc !== null) {
					insertDat(tmp);
				}

				dashedlines_found = true;
				continue;
			}

			if (dashedlines_found && !line.startsWith(' ')) {
				const fam = line.split('(')[0].trim();
				tmp._fam = fam;
				dashedlines_found = false;
				// console.log("identified fam", tmp_fam, line)
				continue;
			}

			let tokens = line.trim().split(/\s+/);
			// console.log(tokens.length, tokens)

			// Person Data
			if (tmp._fam !== null && tokens.length === 5) {
				insertDat(tmp);

				const id = parseInt(tokens[0]),
					father_id = parseInt(tokens[1]),
					mother_id = parseInt(tokens[2]),
					gender = parseInt(tokens[3]),
					affected = parseInt(tokens[4]);

				const perc = new Person(id, gender, affected, mother_id, father_id);
				// console.log("found new perc", perc)

				familyMapOps.insertPerc(perc, tmp._fam);
				tmp._perc = familyMapOps.getPerc(perc.id, tmp._fam);

				//continue
			}

			//Allele Data
			if (tmp._fam !== null && tmp._perc !== null && tokens.length === 6) {
				tokens = tokens.map((x) => parseInt(x));

				tmp._allpat.push(tokens[0]);
				tmp._allmat.push(tokens[1]);

				if (use_descent) {
					tmp._decpat.push(tokens[2]);
					tmp._decmat.push(tokens[3]);
				}
			}
		}
	}

	static populateMarkerMap(text_unformatted) {}
}
