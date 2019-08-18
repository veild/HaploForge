const init = {
	clearMaps() {
		familyDraw.active_fam_group = null;

		FounderColor.clear();
		GlobalLevelGrid.clear();
		MarkerData.clear();
		familyMapOps.clear();
		uniqueGraphOps.clear();
	},

	haploview: {
		allegro() {
			new Allegro();
		},

		genehunter() {
			new Genehunter(); // yeah "new" is required...
			// gc does its job
			// intergrate the latests changes
		},

		simwalk() {
			new Simwalk();
		},

		merlin() {
			new Merlin();
		}
	},

	pedcreate() {
		HaploPedProps.init();
		graphInitPos(nodeSize + 10, grid_rezY, true);
	}
};

MainPageHandler.defaultload();
