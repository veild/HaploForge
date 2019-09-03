const personDraw = {
	//Ids MUST be unique, even if user doesn't have a specific ID in mind
	// -- Required for makeTempPerson() to have unique hooks in family and graph data
	// -- The user can then change it later
	used_ids: {},

	makeTempPerson() {
		//Get smallest unused id
		let id_counter = 0;
		while (++id_counter in this.used_ids) {}

		return new Person(id_counter, 1, 1, 0, 0);
	},

	changeNodeProps(node) {
		const oldX = node.getX(),
			  oldY = node.getY(),
			  oldID = node.id,
			  famid = node.family;

		const old_person = familyMapOps.getPerc(oldID, famid);
		let new_person = null;

		persProps.display(old_person, function onSubmit(newPerc) {
			new_person = newPerc;

			if (oldID !== new_person.id) {
				if (new_person.id in personDraw.used_ids) {
					utility.notify('Error', `Id ${new_person.id} already in use`);
					return -1;
				}
			}

			// Update ids list
			delete personDraw.used_ids[oldID];

			uniqueGraphOps.deleteNode(oldID, famid);

			familyMapOps.removePerc(oldID, famid);
			personDraw.addNode(new_person, famid, { x: oldX, y: oldY });

			// One cannot simply update name/id/gender/affectation, because
			// mateline and childlines are hardcoded to IDs. Easier to delete and reinsert.

			familyMapOps.insertPerc(new_person, famid);

			// -- child lines to parents
			if (old_person.father !== 0) {
				const childline = uniqueGraphOps.getChildEdge(
					famid,
					old_person.father.id,
					old_person.mother.id,
					old_person.id
				);

				uniqueGraphOps.deleteEdge(childline, famid);

				const mateline_key = edgeAccessor.matelineID(old_person.father.id, old_person.mother.id);

				new OffspringDraw(famid, mateline_key, new_person.id);
			}

			// -- mate lines to partners
			if (old_person.mates.length > 0) {
				old_person.foreachmate(mate => {
					const male = mate.gender === PED.MALE ? mate : old_person;
					const female = mate.gender === PED.FEMALE ? mate : old_person;

					const old_mate_key = uniqueGraphOps.getMateEdge(famid, male.id, female.id);

					uniqueGraphOps.deleteEdge(old_mate_key, famid);

					if (new_person.gender === old_person.gender) {
						console.log('joining', famid, mate.id, new_person.id);
						new MatelineDraw(famid, mate.id, new_person.id);

						old_person.foreachchild(mate, child => {
							const old_childline = uniqueGraphOps.makeChildEdge(famid, male.id, female.id, child.id);

							const isMother = new_person.gender === PED.FEMALE;
							let new_childline = null;

							if (isMother) {
								new_childline = uniqueGraphOps.makeChildEdge(famid, mate.id, new_person.id, child.id);
								child.mother = new_person;
							} else {
								new_childline = uniqueGraphOps.makeChildEdge(famid, new_person.id, mate.id, child.id);
								child.father = new_person;
							}

							uniqueGraphOps.transferEdge(famid, old_childline, new_childline);
							new_person.addChild(child);
						});
					} else {
						// Mates are incompatible genders, children are now orphaned.
						console.log('detach this and childs!');
					}
				});
			}

			// Regenerate the level grid otherwise drag functions cry
			//GlobalLevelGrid.refreshGrid(famid);

			main_layer.draw();
		});
	},

	showNodeMenu(node) {
		/*TODO*/
		// For now, just change props
		this.changeNodeProps(node);
	},

	addNode(person = null, fam_id = null, position = null) {
		if (fam_id === null) {
			if (!familyDraw.active_fam_group === null) {
				fam_id = familyDraw.active_fam_group.id;
				familyDraw.active_fam_group = uniqueGraphOps.getFam(fam_id);
			}
		}

		if (familyDraw.active_fam_group === null) {
			const num_fams = familyMapOps.numFams();

			if (num_fams !== 0) {
				utility.notify('Note', 'Need to select family first');
			} else {
				utility.notify('No family selected', 'Creating new family');

				familyDraw.addFam(null, null, () => {
					personDraw._addNodeToActiveFam(person, position);
				});
			}
		} else {
			personDraw._addNodeToActiveFam(person, position);
		}
	},

	_addNodeToActiveFam(person = null, position = null) {
		const fam_group = familyDraw.active_fam_group;
		uniqueGraphOps.insertFam(fam_group.id, fam_group);

		if (person === null) {
			person = this.makeTempPerson();
		}

		const perc = Graphics.Pedigree.addPerson(
			person,
			fam_group,
			grid_rezX,
			-nodeSize // + Math.random()*grid_rezY*2
		);
		perc.family = fam_group.id;

		personDraw.addClickFunctions(perc);

		//family map stores the person data
		// used_ids stores the graphics
		familyMapOps.insertPerc(person, perc.family);
		uniqueGraphOps.insertNode(person.id, perc.family, perc);

		if (position !== null) {
			perc.setX(position.x);
			perc.setY(position.y);
		} else {
			// Find next free space
			const next_avail_pos = SelectionGraphics.nextEmptySlot(familyDraw.active_fam_group.id);
			perc.setX(next_avail_pos.x);
			perc.setY(next_avail_pos.y);
		}

		main_layer.draw();
		return perc;
	},

	addClickFunctions(perc) {
		perc.on('click', () => {
			familyDraw.selectFam(this.family);
		});

		perc.on('dblclick', () => {
			personDraw.showNodeMenu(this);
		});

		// Add to used IDs
		personDraw.used_ids[perc.id] = perc;
	}
};
