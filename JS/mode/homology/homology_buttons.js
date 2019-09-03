const HomologyButtons = {
	_alreadyset: false,

	_group: document.getElementById('homology_buttons'),
	_type_accessor: document.getElementById('plot_type'),
	_minext_accessor: document.getElementById('zygous_min_stretch'),
	_minscore_accessor: document.getElementById('zygous_min_score'),

	_export_accessor: document.getElementById('homology_export'),
	_redraw_accessor: document.getElementById('homology_redraw'),
	//_exit_accessor : document.getElementById('hom_exit'),

	init() {
		HomologyButtons._show();

		if (HomologyButtons._alreadyset) {
			return 0;
		}

		// Make onclick events
		//
		// For now, hide the redrawer, it's already locked to onchange for other accessors
		HomologyButtons._redraw_accessor.style.display = 'none';
		//HomologyButtons._redraw_accessor.onclick = HomologyMode.redraw;

		HomologyButtons._export_accessor.onclick = () => {
			utility.yesnoprompt(
				'Homology Export',
				'Export All or Shown?',
				'All',
				HomologyButtons._printAll,
				'Shown',
				HomologyButtons._printCurrent
			);
		};
		HomologyButtons.setonchange();
		HomologyButtons._alreadyset = true;
	},

	setonchange() {
		for (const item in HomologyButtons) {
			if (item.indexOf('_accessor') !== -1) {
				HomologyButtons[item].onchange = HomologyButtons.updateAll;
			}
		}
	},

	updateAll() {
		HomologyButtons.updateHomologyInputs();
		HomologyMode.redraw();
	},

	updateHomologyInputs() {
		HomologyMode.type = HomologyButtons._type_accessor.value;

		HomologyMode.minexten = Number(HomologyButtons._minext_accessor.value);
		HomologyMode.minscore = Number(HomologyButtons._minscore_accessor.value);
	},

	_printAll() {
		HomologyPlot.printToFile(HomologyMode.selected_for_homology);
	},

	_printCurrent() {
		HomologyPlot.printToFile(HomologyMode.selected_for_homology, HaploBlock.sta_index, HaploBlock.end_index);
	},

	_show() {
		HomologyMode._active = true;
		HomologyButtons._group.style.display = 'block';
	}
};
