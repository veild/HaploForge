debugGH = {};

class Genehunter extends FileFormat {
	constructor(mode_init = null) {
		const haplo = {
			id: 'ghm_haplo',
			process: function(haplo_text) {
				debugGH.haplo = haplo_text;
				Genehunter.populateFamilyAndHaploMap(haplo_text);
			},
			hasMarkerNames: false,
			inferGenders: true // unless ped is uploaded!
		};

		const map = {
			id: 'ghm_map',
			process: function(map_text) {
				debugGH.map = map_text;
				Genehunter.populateMarkerMap(map_text);
			}
		};

		const ped = {
			id: 'ghm_ped',
			process: FileFormat.updateFamily
		};

		super(haplo, map, ped, null, mode_init);
	}

	static populateMarkerMap(text_unformatted) {
		const lines = text_unformatted.split('\n');
		let current_chrom = null;

		// Skip header
		const markers = [],
			gps = [];

		for (let l = 1; l < lines.length; l++) {
			const line = lines[l].trim(),
				tokens = line.split(/\s+/);

			if (line === '') {
				continue;
			}

			if (current_chrom === null) {
				current_chrom = tokens[0];
			} else if (current_chrom !== tokens[0]) {
				throw new Error('Chrom changed from ' + current_chrom + ' to ' + tokens[0]);
			}

			const genpos = Number(tokens[1]),
				marker = tokens[2].trim();

			markers.push(marker);
			gps.push(genpos);
		}

		MarkerData.addGenePos(gps);
		MarkerData.addMarkers(markers);
	}

	static populateFamilyMap(text_unformatted) {}

	static populateFamilyAndHaploMap(text_unformatted) {
		const lines = text_unformatted.split('\n');
		let tmp_perc = null;
		let current_fam = null;

		for (const line of lines) {
			// New family line
			if (line.startsWith('*****')) {
				let star_fam_score = line.split(/\s+/);
				current_fam = parseInt(star_fam_score[1]);
				continue;
			}

			const tokens = line.trim().split(/\s+/).map((a) => parseInt(a));

			// Second Allele, finish and insert into family ap
			if ((line.startsWith('   ') || line.startsWith('\t\t')) && tmp_perc !== null) {
				const haplo2 = tokens;

				tmp_perc.insertHaploData(haplo2);

				familyMapOps.insertPerc(tmp_perc, current_fam);
				tmp_perc = null;
				continue;
			}

			// First Allele and person data
			const haplo1 = tokens.splice(4),
				pdata = tokens;

			const person = new Person(
				pdata[0], //id
				0, //gender -- undeclared, inferred from parentage
				pdata[3], //affected
				pdata[2], //mother
				pdata[1] //father
			);
			person.insertHaploData(haplo1);

			tmp_perc = person;
		}
	}
}
