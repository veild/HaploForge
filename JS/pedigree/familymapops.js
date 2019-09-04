const familyMapOps = {
	_map: {}, // fam_id ---> pedigree map --> person

	_insertionLog: {}, // famid+pedid : counter of how many times attempted insertion
	// should not exceed 2 (per allele line from pedfile)

	clear() {
		familyMapOps._map = {}; // reset
	},

	foreachfam(callback) {
		for (const fam in familyMapOps._map) {
			callback(fam, familyMapOps.getFam(fam));
		}
	},

	/* If fam_id given, it just iterates over people in the specified famid */
	foreachperc(callback, fam_id = null) {
		if (fam_id === null) {
			for (const fid in familyMapOps._map) {
				for (var pid in familyMapOps.getFam(fid)) {
					callback(pid, fid, familyMapOps.getPerc(pid, fid));
				}
			}
		} else {
			for (var pid in familyMapOps.getFam(fam_id)) {
				callback(pid, familyMapOps.getPerc(pid, fam_id));
			}
		}
	},

	numFams() {
		let count = 0;
		for (const fam in familyMapOps._map) {
			count++;
		}
		return count;
	},

	numPercs(famid) {
		let count = 0;
		for (const perc in familyMapOps._map[famid]) {
			count++;
		}
		return count;
	},

	getRandomPerc() {
		for (const fam in familyMapOps._map) {
			return familyMapOps.getFirst(fam);
		}
		throw new Error('No families');
	},

	/* Grab the first individual */
	getFirst(family_id) {
		for (const ped in familyMapOps.getFam(family_id)) {
			return familyMapOps.getPerc(ped, family_id);
		}

		return -1;
	},

	_loginsertion(person_id, family_id) {
		const key = `${family_id}_${person_id}`;
		familyMapOps._insertionLog[key] = familyMapOps._insertionLog[key] + 1 || 1;
		return familyMapOps._insertionLog[key];
	},

	_insertPercAsChild(person, family_id) {
		if (person.mother !== 0) {
			person.mother.addChild(person);
		}
		if (person.father !== 0) {
			person.father.addChild(person);
		}
	},

	_removePercAsChild(person, family_id) {
		if (person.mother !== 0) {
			person.mother.removeChild(person);
		}
		if (person.father !== 0) {
			person.father.removeChild(person);
		}
	},

	_removePercAsMate(person, family_id) {
		if (person.mates.length > 0) {
			person.foreachmate(mate => {
				mate.removeMate(person);
			});
		}
	},

	_removePercAsParent(person, family_id) {
		if (person.children.length > 0) {
			const isMother = person.gender === PED.FEMALE;

			person.foreachmate(mate => {
				person.foreachchild(mate, child => {
					if (isMother) {
						child.mother = 0;
					} else {
						child.father = 0;
					}
				});
			});
		}
	},

	/* used outside of default insertPerc function*/
	insertPercAsParent(person, family_id, children) {
		const isMother = person.gender === PED.FEMALE;

		for (let c = 0; c < children.length; c++) {
			if (isMother) {
				children[c].mother = person;
			} else {
				children[c].father = person;
			}
		}
	},

	updatePerc(old_id, person, family_id) {
		const oldperson = familyMapOps.getPerc(old_id, family_id);

		oldperson.id = person.id;
		oldperson.name = person.name;
		oldperson.gender = person.gender;
		oldperson.affected = person.affected;
	},

	updateIntoPerc(old_id, person, family_id) {
		if (familyMapOps.percExists(old_id, family_id)) {
			familyMapOps.updatePerc(old_id, person, family_id);
			return 0;
		}

		familyMapOps.insertPerc(person, family_id);
	},

	insertPerc(person, family_id) {
		if (!(family_id in familyMapOps._map)) {
			familyMapOps._map[family_id] = {};
			console.log('FMO: added new fam', family_id);
		}

		const num_attempts = familyMapOps._loginsertion(person.id, family_id);

		if (!(person.id in familyMapOps._map[family_id])) {
			familyMapOps._map[family_id][person.id] = person;
			//familyMapOps._insertPercAsChild(person, family_id);

			return 0;
		}

		if (num_attempts > 2) {
			console.log(person.id, 'already in', family_id, num_attempts, 'times');
		}
		return -1;
	},

	getFam(family_id) {
		if (familyMapOps.famExists(family_id)) {
			return familyMapOps._map[family_id];
		}
		return -1;
	},

	removeFam(family_id) {
		if (familyMapOps.famExists(family_id)) {
			delete familyMapOps._map[family_id];
			return 0;
		}
		return -1;
	},

	famExists(family_id) {
		return family_id in familyMapOps._map;
	},

	percExists(person_id, family_id) {
		if (familyMapOps.famExists(family_id)) {
			return person_id in familyMapOps.getFam(family_id);
		}
		return false;
	},

	removePerc(person_id, family_id) {
		if (family_id in familyMapOps._map) {
			if (person_id in familyMapOps._map[family_id]) {
				const person = familyMapOps.getPerc(person_id, family_id);

				familyMapOps._removePercAsChild(person, family_id);
				familyMapOps._removePercAsMate(person, family_id);
				familyMapOps._removePercAsParent(person, family_id);

				delete familyMapOps._map[family_id][person_id];

				return 0;
			}
			console.log(person_id, 'not in', family_id);
			return -1;
		}
		console.log(family_id, 'not in map');
		return -1;
	},

	getPerc(person_id, family_id) {
		if (person_id in familyMapOps._map[family_id]) {
			return familyMapOps._map[family_id][person_id];
		}
		throw new Error(`${person_id} not in ${family_id}`);
	},

	inferGenders(family_id = null) {
		familyMapOps.foreachperc((pid, fid, perc) => {
			if (perc.gender === PED.UNKNOWN) {
				//console.log("unknown", perc.id, perc.children);

				if (perc.children.length > 0) {
					const firstChild = perc.children[0];

					const mother_id = firstChild.mother.id,
						  father_id = firstChild.father.id;

					//console.log("unknown has kids", perc.id, mother_id, father_id);

					if (mother_id === perc.id) {
						perc.gender = PED.FEMALE;
					} else if (father_id === perc.id) {
						perc.gender = PED.MALE;
					} else {
						throw new Error(perc, firstChild);
					}
				}
			}
		}, family_id);
	},

	/** Members of the same family are actually related via some DOS */
	areConnected(perc1_fam_id, perc1_id, perc2) {
		let perc1 = familyMapOps.getPerc(perc1_id, perc1_fam_id),
			perc2_id = Number(perc2);

		const traversed = {};

		function recurseSearch(perc) {
			if (perc === 0) {
				return 0;
			}

			if (perc.id in traversed) {
				return 0;
			}
			traversed[perc.id] = 1;

			if (perc.id === perc2_id) {
				return true;
			}

			for (let mate of perc.mates) {
				let res00 = recurseSearch(mate);
				if (res00 === true) {
					return true;
				}

				for (let child of perc.children) {
					let res01 = recurseSearch(child);
					if (res01 === true) {
						return true;
					}
				}
			}

			// Parents
			let res1 = recurseSearch(perc.mother);
			let res2 = recurseSearch(perc.father);

			if (res1 === true || res2 === true) {
				return true;
			}
			return false;
		}
		return recurseSearch(perc1);
	}
};
