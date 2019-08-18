const MainButtonActions = {
	_temphaploload: null,

	preamble() {
		makeStage();
		init.clearMaps();
	},

	fileUpload: fileSelector.init,

	loadHaploFromStorage(hap_data = null) {
		FileFormat.__begFuncs();

		if (hap_data === null) {
			hap_data = localStorage.getItem(localStor.hap_save);
		}

		// Still empty?
		if (hap_data === null) {
			console.log('No haplo data saved');
			MainButtonActions.exitToMenu();
			return;
		}

		SerialParse.All.import(hap_data);
		HaploPedProps.init();

		FileFormat.__endFuncs(null); // :=null  ensures that HGroups aren't reassigned.
	},

	loadPedFromStorage(haplotransfer = false) {
		MainButtonActions.preamble();
		MainPageHandler.createpedmode();

		let ped_data, ped_type;

		if (!haplotransfer) {
			ped_data = localStorage.getItem(localStor.ped_save);
			Pedfile.import(ped_data);
		} else {
			ped_data = localStorage.getItem(localStor.transfer);
			console.log(ped_data);
			//Do.Something.Else();
		}

		init.pedcreate();
	},

	savePedToStorage() {
		const ped_to_string = Pedfile.export(true);
		if (ped_to_string === -1) {
			return;
		}
		/*always store graphics for local, only export has no graphics option*/

		localStorage.setItem(localStor.ped_save, ped_to_string);
		localStorage.setItem(localStor.ped_type, localStor.ped_type);

		utility.notify('Pedigree Saved', '...');
	},

	saveHaploToStorage() {
		//Save to local storage
		localStorage.setItem(localStor.hap_save, SerialParse.All.export());
		utility.notify('Haplo File Saved', '...');
	},

	exitToMenu() {
		if (ModeTracker.currentMode === ModeTracker.modes.pedcreate) {
			const changeDetected = Pedfile.pedigreeChanged();

			if (changeDetected) {
				utility.yesnoprompt(
					'Pedigree Modified',
					'Save changes before exit?',
					'Yes',
					() => {
						MainButtonActions.savePedToStorage();
						//MainPageHandler.defaultload();
						location.reload();
					},
					'No',
					() => {
						MainPageHandler.defaultload();
					}
				);
			} else {
				//MainPageHandler.defaultload();
				location.reload();
			}
		} else {
			// Haplo Types are automatically saved and loaded
			//MainPageHandler.defaultload();
			location.reload();
		}
	},

	createNewPed() {
		MainButtonActions.preamble();
		MainPageHandler.createpedmode();

		/*		var d = document.getElementById('pedcreate_views');
		d.style.position = "absolute";
		d.style.zIndex = 122;
		d.style.display = "";*/
	}
};
