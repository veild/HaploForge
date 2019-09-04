// This should not be optimized for graphics, this is for data processing only(!!)
//
class Person {
	constructor(id, gender, affected, mother = 0, father = 0, name = null) {
		this.id = Number(id);
		this.gender = Number(gender); // 1 - male, 2-female, 0-unknown
		this.affected = Number(affected); // 0,1,2

		this.mother = Number(mother);
		this.father = Number(father);
		this.haplo_data = []; // [Allele1, Allele2]

		this.mates = [];
		this.children = []; // added by connect method later

		//Optional
		this.name = name;

		//Placeholder to be immediately deleted after read
		this.stored_meta;
	}

	insertDescentData(normal_array) {
		if (this.haplo_data[0].descent === null) {
			this.haplo_data[0].addDescent(normal_array); // paternal
			return 0;
		}

		if (this.haplo_data[1].descent === null) {
			this.haplo_data[1].addDescent(normal_array); //maternal
			return 0;
		}
		throw new Error(`${this.id} already has populated Alleles`);
	}

	insertFlowData(normal_array) {
		if (this.haplo_data[0].flow === null) {
			this.haplo_data[0].addFlow(normal_array); // paternal
			return 0;
		}

		if (this.haplo_data[1].flow === null) {
			this.haplo_data[1].addFlow(normal_array); //maternal
			return 0;
		}
		throw new Error(`${this.id} already has populated Alleles`);
	}

	setHaplogroupArray(normal_array) {
		if (this.haplo_data[0].haplogroup_array === null) {
			this.haplo_data[0].haplogroup_array = new Int8Array(normal_array);
			return 0;
		}

		if (this.haplo_data[1].haplogroup_array === null) {
			this.haplo_data[1].haplogroup_array = new Int8Array(normal_array);
			return 0;
		}
		throw new Error(`${this.id} already has haplogroups set!`);
	}

	insertHaploData(normal_array) {
		const num_alleles = this.haplo_data.length;

		if (num_alleles === 0) {
			this.haplo_data.push(new Allele(normal_array));
			return 0;
		}
		if (num_alleles === 1) {
			const chromlen = this.haplo_data[0].getLength();
			if (chromlen === normal_array.length) {
				this.haplo_data.push(new Allele(normal_array));
				return 0;
			}
			console.log(this);
			throw new Error(`${this.id} Allele sizes not consistent! ${chromlen} vs ${normal_array.length}`);
		}
		throw new Error(`${this.id} already has populated Alleles`);
	}

	// Identical in relationships
	isDoppelGanger(pers2) {
		if (this.mother === pers2.mother && (this.father && pers2.father)) {
			if (this.mates.length === pers2.mates.length) {
				for (var c = 0; c < this.mates.length; c++) {
					if (this.mates[c].id !== pers2.mates[c].id) {
						return false;
					}
				}

				if (this.children.length === pers2.children.length) {
					for (var c = 0; c < this.children.length; c++) {
						if (this.children[c].id !== pers2.children[c].id) {
							return false;
						}
					}
					return true;
				}
			}
		}
		return false;
	}

	isMate(pers2) {
		let compare = pers2;
		if (pers2 === 0) {
			compare = { id: 0 };
		}

		for (let m = 0; m < this.mates.length; m++) {
			if (compare.id == this.mates[m].id) {
				return true;
			}
		}
		return false;
	}

	foreachmate(callback) {
        this.mates.forEach((mate, m) => {
            callback(mate, m);
        });
    }

	foreachchild(mate, callback) {
		const common_children = intersectArrays(this.children, mate.children);

        common_children.forEach((child, c) => {
            callback(child, c);
        });
	}

	hasHaplo() {
		return this.haplo_data.length > 1 && this.haplo_data[0].haplogroup_array !== null;
	}

	hasChild(child) {
		for (let c = 0; c < this.children.length; c++) {
			if (child.id === this.children[c].id) {
				return true;
			}
		}
		return false;
	}

	isFounder() {
		return this.mother === 0 && this.father === 0;
	}

	addMate(mate) {
		// Already exists
		if (this.isMate(mate)) {
			return -1;
		}
		this.mates.push(mate);
	}

	removeMate(mate) {
		if (this.isMate(mate)) {
			const mate_index = this.mates
				.map(a => a.id)
				.indexOf(mate.id);
			if (mate_index !== -1) {
				this.mates.splice(mate_index, 1);
				return 0;
			}
		}
		return -1;
	}

	addChild(child) {
		// Already exists
		if (this.hasChild(child)) {
			return -1;
		}
		this.children.push(child);
	}

	removeChild(child) {
		if (this.hasChild(child)) {
			const child_index = this.children
				.map(a => a.id)
				.indexOf(child.id);
			if (child_index !== -1) {
				this.children.splice(child_index, 1);
				return 0;
			}
		}
		return -1;
	}
}
