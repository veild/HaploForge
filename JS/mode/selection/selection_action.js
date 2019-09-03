const SelectionAction = {
	toggle_selection_all: false,
	toggle_selection_affecteds: false,

	reset() {
		SelectionAction.toggle_selection_all = false;
		SelectionAction.toggle_selection_affecteds = false;
	},

	selectAll() {
		SelectionAction.toggle_selection_all = !SelectionAction.toggle_selection_all;

		for (const key in SelectionMode._items) {
			const item = SelectionMode._items[key];
			if (
				(SelectionAction.toggle_selection_all && !item.selected) ||
				(!SelectionAction.toggle_selection_all && item.selected)
			) {
				item.box.fire('click');
			}
		}
	},

	selectAffecteds() {
		SelectionAction.toggle_selection_affecteds = !SelectionAction.toggle_selection_affecteds;

		for (const key in SelectionMode._items) {
			const item = SelectionMode._items[key];
			const affected = item.graphics.children[0].attrs.fill === col_affs[2];

			if (affected) {
				if (
					(SelectionAction.toggle_selection_affecteds && !item.selected) ||
					(!SelectionAction.toggle_selection_affecteds && item.selected)
				) {
					item.box.fire('click');
				}
			}
		}
		//		console.log("affecteds:",
		//			Object.keys(SelectionMode._items).filter( function (n){ return SelectionMode._items[n].affected === true;})
		//		);
	}
};
