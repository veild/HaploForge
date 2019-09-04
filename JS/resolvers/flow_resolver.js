const FlowResolver = {
	unique_haplos: [], // accessed by Merlin

	// 'A' 'B' 'C' alone are unique only to family, so we add family magic
	convertGroupsToFamilySpecific(data, fam) {
		for (let v = 0; v < data.length; v++) {
			const alpha = `${data[v]}--${fam}`;

			if (FlowResolver.unique_haplos.indexOf(alpha) === -1) {
				FlowResolver.unique_haplos.push(alpha);
			}
			data[v] = FlowResolver.unique_haplos.indexOf(alpha);
		}
	},

	initFounderAlleles() {
		FounderColor.hgroup = FlowResolver.unique_haplos;
	},

	child2parent_link(child, mother, father, fam) {
		//		console.log(child, mother, father)

		const chil_allele1 = child.haplo_data[0],
			  moth_allele1 = mother.haplo_data[0],
			  fath_allele1 = father.haplo_data[0];

		const chil_allele2 = child.haplo_data[1],
			  moth_allele2 = mother.haplo_data[1],
			  fath_allele2 = father.haplo_data[1];

		//console.log("Attempting", child.id, fam, chil_allele1.pter_array, chil_allele1.flow)

		let i = -1;
		while (++i < chil_allele1.flow.length) {
			// Map allele.flow -> allele.pter_array	color group array
			chil_allele1.pter_array[i].color_group = [ chil_allele1.flow[i] ];
			moth_allele1.pter_array[i].color_group = [ moth_allele1.flow[i] ];
			fath_allele1.pter_array[i].color_group = [ fath_allele1.flow[i] ];

			chil_allele2.pter_array[i].color_group = [ chil_allele2.flow[i] ];
			moth_allele2.pter_array[i].color_group = [ moth_allele2.flow[i] ];
			fath_allele2.pter_array[i].color_group = [ fath_allele2.flow[i] ];

			//console.log(i, fam, child.id, mother.id, father.id)
		}

		//console.log("Result?", child.id, fam, chil_allele1.pter_array, chil_allele1.flow)
	}
};
