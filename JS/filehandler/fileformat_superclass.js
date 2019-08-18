function debugSaveHaplo() {
	localStorage.setItem('TEST', MainButtonActions._temphaploload);
}

class FileFormat {
	constructor(haplo, map = null, ped = null, descent = null, afterCallback = null) {
        this.descentfile = descent === null ? 0 : document.getElementById(descent.id).files[0] || 0;
        this.haplofile = haplo === null ? 0 : document.getElementById(haplo.id).files[0] || 0;
        this.mapfile = map === null ? 0 : document.getElementById(map.id).files[0] || 0;
        this.pedfile = ped === null ? 0 : document.getElementById(ped.id).files[0] || 0;

        if (haplo === null) {
			throw new Error('No haplo file given');
		}

        const that = this;
        let useresolver = AssignHGroups.resolvers.ASTAR;
        const queue = new PromiseQueue(PromiseQueue.pFileRead);

        FileFormat.__begFuncs();

        console.groupCollapsed('File Processing');

        // Haplo *must* get called
        queue.addJob({
			type: 'haplo',
			file: this.haplofile,
			fed_data: haplo.fed_data || false,
			task(haplo_text) {
				MainButtonActions._temphaploload = haplo_text; // for transferring from haplo to pedcreate
				haplo.process(haplo_text);

				// Sometimes the haplo file has RS data and this step is not neccesary.
				if (!haplo.hasMarkerNames && that.mapfile === 0) {
					// Enumerate map based on number of locus
					FileFormat.enumerateMarkers();
				}
			}
		});

        // Map GOES FIRST!
        if (this.mapfile !== 0) {
			queue.addJob({ type: 'map', file: this.mapfile, task: map.process });
		}

        // Descent graph
        if (this.descentfile !== 0) {
			useresolver = descent.resolver_mode;
			queue.addJob({ type: 'descent', file: this.descentfile, task: descent.process });
		} else if (haplo.useDescent !== undefined) {
			// The descent graph for simwalk is within the haplo data
			if (haplo.useDescent) {
				useresolver = haplo.resolver_mode;
			}
		}

        // Ped data
        if (this.pedfile !== 0) {
			queue.addJob({ type: 'pedfile', file: that.pedfile, task: ped.process });
		}

        // Process all jobs, then run finish func
        queue.exec(res_array => {
			console.groupEnd();

			if (afterCallback !== null) {
				afterCallback();
			} else {
				// Assume Haplo mode is final callback
				HaploPedProps.init(() => {
					if (haplo.inferGenders && that.pedfile === 0) {
						familyMapOps.inferGenders();
					}
				});
			}
			// No descent file performs Hgroup assignment
			FileFormat.__endFuncs(useresolver);
		});
    }

	static __begFuncs() {
		// Flush all maps
		MainButtonActions.preamble();
		MainPageHandler.haplomodeload();
	}

	// If useresolver === null, we ignore assignHGroups
	//   altogether (useful when loading a prior analysis)
	static __endFuncs(descentmode = 0) {
		graphInitPos(nodeSize + 10, grid_rezY);

		console.groupCollapsed('Haploblock Assignment');
		if (descentmode === null) {
			console.log('Resolve: Load From Storage');
		} else {
			AssignHGroups.init(descentmode);
			BenchStopwatch.stop();
		}
		console.groupEnd();

		MarkerData.padMarkerMap();
	}

	static enumerateMarkers() {
		// No map -- enumerate markers off some random perc
		const randomperc = familyMapOps.getRandomPerc(),
			  allele_length = randomperc.haplo_data[0].data_array.length;

		const markers = [];

		for (let m = 0; m < allele_length; m++) {
			markers.push(String(`          ${m}`).slice(-10));
		}

		MarkerData.addMarkers(markers);
	}

	// Shared utils
	static updateFamily(text_unformatted) {
		//		console.log("::Pedin --- start");

		const lines = text_unformatted.split('\n');

		for (let l = 0; l < lines.length; l++) {
			const line = lines[l].trim();

			if (line.length === 0) {
				continue;
			}

			const tokens = line.split(/\s+/);

			const fam = Number(tokens[0]);

			const pers = new Person(
				Number(tokens[1]), // id
				Number(tokens[4]), // gender
				Number(tokens[5]), // affect
				Number(tokens[3]), // mother
				Number(tokens[2]) // father
			);

			// This should ONLY update existing
			//console.log( pers.id, fam );
			const perc = familyMapOps.getPerc(pers.id, fam);
			familyMapOps.updateIntoPerc(perc.id, pers, fam);
		}
		//		console.log("::Pedin --- finish");
	}
}
