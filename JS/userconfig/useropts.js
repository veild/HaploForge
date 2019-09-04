// UI configurable:
const userOpts = {
	showTooltips: true,
	fancyGraphics: true,

	update(key, value) {
		if (key in userOpts) {
			userOpts[key] = value;
		}
		localStorage.setItem(`userOpts.${key}`, value);
	},

	retrieve(key) {
		if (key in userOpts) {
			const value = localStorage.getItem(`userOpts.${key}`);

			let res = false;

			// default enable everything
			if (value === null) {
				res = true;
			} else {
				res = value === 'true';
			}

			// Set
			userOpts[key] = res;

			return res;
		}
		throw new Error(`${key} not in userOpts`);
	},

	setGraphics() {
		if (userOpts.fancyGraphics) {
			HaploBlockFormat.applyFancy();
			BackgroundVidMain.addVid();
		} else {
			HaploBlockFormat.applyDefault();
			BackgroundVidMain.removeVid();
		}

		if (HaploWindow._bottom !== null) {
			HaploBlockFormat.hasGPData(MarkerData.hasGPData);
			HaploBlock.redrawHaplos();
		}
	}
};
