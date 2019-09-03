// Set by cssfuncs/buttonmodes/general.js
// -- but good to keep it here

const ModeTracker = {
	currentMode: null,

	modes: {
		pedcreate: 0,
		haploview: 1,
		selection: 2,
		comparison: 3,
		homselection: 4,
		homology: 5
	},

	setMode(mode) {
		if (mode in ModeTracker.modes) {
			ModeTracker.currentMode = ModeTracker.modes[mode];

			if (mode in MouseResize.resize_modes) {
				MouseResize.on();
			} else {
				MouseResize.off();
			}

			return 0;
		}
		console.log('mode', mode);
		throw new Error('invalid mode');
	}
};
