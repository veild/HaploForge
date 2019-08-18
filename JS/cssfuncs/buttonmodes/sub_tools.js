/* Class that rewrites the selection_tools div to swap in tools for each mode */
const ToolButtons = {
	table_keys: {},
	div: document.getElementById('selection_tools'),
	table: document.getElementById('selection_table'),
	title: document.getElementById('selection_title'),

	setWidth(px) {
		ToolButtons.div.style.width = `${px}px`;
	},

	setTitle(title) {
		ToolButtons.title.innerHTML = title;
	},

	__addToToolsContainer(toolbutton) {
		ToolButtons.table_keys[toolbutton.innerHTML] = toolbutton;

		var row = ToolButtons.table.insertRow(),
			cell = row.insertCell();

		cell.appendChild(toolbutton);
	},

	addToolsToggleButton(message, shortcut, text, callback) {
		ToolButtons.__addToToolsContainer(
			ButtonModes.makeToolsToggleButton('sidetool', message, `${shortcut}|${text}`, callback)
		);
	},

	addToolsButton(message, shortcut, text, callback) {
		ToolButtons.__addToToolsContainer(
			ButtonModes.makeToolsButton('sidetool', message, `${shortcut}|${text}`, callback)
		);
	},

	__removeFromToolsContainer(key) {
		const button = ToolButtons.table_keys[key],
			  cell = button.parentNode,
			  row = cell.parentNode,
			  rowInd = row.rowIndex;

		row.deleteCell(0);
		ToolButtons.table.deleteRow(rowInd);

		delete ToolButtons.table_keys[key];
	},

	/* Switching modes */
	modes: {
		clearMode() {
			for (const k in ToolButtons.table_keys) {
				ToolButtons.__removeFromToolsContainer(k);
			}
			ButtonModes.removeKeyboardShortcuts('sidetool');

			ToolButtons.setTitle('');
			ToolButtons.div.style.display = 'none';
		},

		preamble() {
			ToolButtons.modes.clearMode();
			ToolButtons.div.style.display = 'block';
		},

		/* Pedigree Creation View */
		setToPedCreate() {
			ToolButtons.modes.preamble();

			ToolButtons.setTitle('Ped Tools');

			ToolButtons.addToolsButton(
				'Add Individual',
				Settings.bindings.pedcreate['Add Individual'],
				'Adds an individual to the active family, which can then be modified by double-clicking on it',
				() => {
					personDraw.addNode();
				}
			);

			ToolButtons.addToolsButton(
				'Add Family',
				Settings.bindings.pedcreate['Add Family'],
				'Adds a new family to the screen',
				() => {
					familyDraw.addFam();
				}
			);

			ToolButtons.addToolsButton(
				'Mate-Mate',
				Settings.bindings.pedcreate['Mate-Mate'],
				'Draws a line between two individuals who will acts as parents.',
				() => {
					new MatelineDraw(familyDraw.active_fam_group.id).init();
				}
			);

			ToolButtons.addToolsButton(
				'Parent-Offspring',
				Settings.bindings.pedcreate['Parent-Offspring'],
				'Draws a line between an individual and a couple who will be their parents',
				() => {
					new OffspringDraw(familyDraw.active_fam_group.id).init();
				}
			);
		},

		/* Haplo View */
		setToHaploView() {
			ToolButtons.modes.preamble();

			//ToolButtons.setWidth(90);
			ToolButtons.setTitle('Pedigree');

			ToolButtons.addToolsButton(
				'Start Analysis',
				Settings.bindings.haploview['Start Analysis'],
				'Begins the selection process',
				SelectionMode.init
			);

			/*ToolButtons.addToolsButton("Modify Pedigree",
				Settings.bindings.haploview["Modify Pedigree"],
				"[NOT YET IMPLEMENTED]Modifies the current pedigree",
				
				function(){
					localStorage.setItem(localStor.transfer, SerialParse.All.exportAsPed());
					utility.notify("transferring","...");

					MainButtonActions.loadPedFromStorage(true);
				}
			);*/

			ToolButtons.addToolsButton(
				'Reset Positions',
				Settings.bindings.haploview['Reset Family Positions'],
				'Packs families next to each other',
				() => {
					FamSpacing.init();
					autoScaleStage();
				}
			);
		},

		/* Selection Editting View */
		setToSelectionMode() {
			ToolButtons.modes.preamble();

			ToolButtons.setTitle('Selection');

			ToolButtons.addToolsButton(
				'Toggle All',
				Settings.bindings.global['Toggle All'],
				'Selects all individuals from all families',
				SelectionAction.selectAll
			);

			ToolButtons.addToolsButton(
				'Toggle Affecteds',
				Settings.bindings.global['Toggle Affecteds'],
				'Selects all affected individuals from all families',
				SelectionAction.selectAffecteds
			);

			ToolButtons.addToolsButton(
				'Submit',
				Settings.bindings.global['Submit'],
				'Submits selection for haplotype viewing',
				HaploWindow.init
			);

			ButtonModes.addKeyboardShortcut('sidetool', 'Escape', SelectionMode.quit);
		},

		/* Aka Side-by-Side Haploblock mode: Align, Find Hom, Range, Marker */
		setToComparisonMode() {
			ToolButtons.modes.preamble();

			ToolButtons.setTitle('Haplotypes');

			ToolButtons.addToolsButton(
				'Compare Genotypes',
				Settings.bindings.comparison['Compare Genotypes'],
				'Begins selection process for genotype comparison mode',
				HomologySelectionMode.init
			);

			ToolButtons.addToolsToggleButton(
				'Marker Search',
				Settings.bindings.global['Marker Search'],
				'Toggles marker search window',
				CSSMarkerRange.init
			);

			ToolButtons.addToolsButton(
				'Prev. Recomb.',
				Settings.bindings.comparison['Prev. Recomb.'],
				'Shifts view up to previous recombination',
				HaploBlock.scrollToPrevRecomb
			);

			ToolButtons.addToolsButton(
				'Next  Recomb.',
				Settings.bindings.comparison['Next  Recomb.'],
				'Shifts view down to next recombination',
				HaploBlock.scrollToNextRecomb
			);

			ButtonModes.addKeyboardShortcut('sidetool', 'Escape', HaploWindow.destroy);
		},

		/* From comparison mode, the buttons showed during homology selection */
		// called by HomologySelectionMode.init
		setToHomologySelection() {
			ToolButtons.modes.preamble();

			ToolButtons.setTitle('GT Compare');

			ToolButtons.addToolsButton(
				'Toggle All',
				Settings.bindings.global['Toggle All'],
				'Selects all individuals shown',
				SelectionAction.selectAll
			);

			ToolButtons.addToolsButton(
				'Toggle Affecteds',
				Settings.bindings.global['Toggle Affecteds'],
				'Selects only affected individuals from shown',
				SelectionAction.selectAffecteds
			);

			ToolButtons.addToolsButton(
				'Submit',
				Settings.bindings.global['Submit'],
				'Initiates genotypes comparison mode from those selected',
				HomologySelectionMode.submit
			);

			ButtonModes.addKeyboardShortcut('sidetool', 'Escape', HomologySelectionMode.quit);
		},

		/* Actual tools used in homology plots */
		// called by HomologySelectionMode.submit()
		setToHomologyMode() {
			ToolButtons.modes.preamble();

			ToolButtons.setTitle('GT Compare');

			ToolButtons.addToolsToggleButton(
				'Marker Search',
				Settings.bindings.global['Marker Search'],
				'Toggles marker search window',
				CSSMarkerRange.init
			);

			ButtonModes.addKeyboardShortcut('sidetool', 'Escape', HomologyMode.quit);
		}
	}
};
