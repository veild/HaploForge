const DescentResolver = {
	child2parent_link(child, mother, father, fam) {
        const chil_hp = child.haplo_data,
              moth_hp = mother.haplo_data,
              fath_hp = father.haplo_data;

		// We assume paternal is 1st, and maternal is 2nd allele
        const m1_gts = moth_hp[0].data_array,
              m2_gts = moth_hp[1].data_array,
              f1_gts = fath_hp[0].data_array,
              f2_gts = fath_hp[1].data_array,
              c1_gts = chil_hp[0].data_array,
              c2_gts = chil_hp[1].data_array;

        const m1_des = moth_hp[0].descent,
              m2_des = moth_hp[1].descent,
              f1_des = fath_hp[0].descent,
              f2_des = fath_hp[1].descent,
              c1_des = chil_hp[0].descent,
              c2_des = chil_hp[1].descent;

        const m1_cls = moth_hp[0].pter_array,
              m2_cls = moth_hp[1].pter_array,
              f1_cls = fath_hp[0].pter_array,
              f2_cls = fath_hp[1].pter_array;

		// To be assigned
        const c1_cls = chil_hp[0].pter_array,
              c2_cls = chil_hp[1].pter_array;

		let index = -1;

		//		console.log("Processing...", child, mother, father)

		while (++index < c1_gts.length) {
            const c1_ht = c1_gts[index],
                  c1_ds = c1_des[index],
                  c2_ht = c2_gts[index],
                  c2_ds = c2_des[index];

            const m1_col = m1_cls[index],
                  m2_col = m2_cls[index],
                  f1_col = f1_cls[index],
                  f2_col = f2_cls[index];

            const m1_ht = m1_gts[index],
                  m2_ht = m2_gts[index],
                  f1_ht = f1_gts[index],
                  f2_ht = f2_gts[index];

			if (f1_ht === 0) f1_col.color_group = [ FounderColor.zero_color_grp ];
			if (f2_ht === 0) f2_col.color_group = [ FounderColor.zero_color_grp ];
			if (m1_ht === 0) m1_col.color_group = [ FounderColor.zero_color_grp ];
			if (m2_ht === 0) m2_col.color_group = [ FounderColor.zero_color_grp ];

			// Do paternal (1st)
			let color_assign_c1 = -1;

			switch (c1_ds) {
				case 0:
					color_assign_c1 = -1;
					break;

				case 1:
					color_assign_c1 = f1_col.color_group;
					if (c1_ht !== f1_ht) {
						throw new Error(`Inconsistent HTs [c1,f1]: ${c1_ht} != ${f1_ht}`);
					}
					break;

				case 2:
					color_assign_c1 = f2_col.color_group;
					if (c1_ht !== f2_ht) {
						throw new Error(`Inconsistent HTs [c1,f2]: ${c1_ht} != ${f2_ht}`);
					}
					break;

				default:
					throw new Error('Invalid descent assignment');
			}
			c1_cls[index].color_group = color_assign_c1;

			// Do maternal (2nd)
			let color_assign_c2 = -1;

			switch (c2_ds) {
				case 0:
					color_assign_c2 = -1;
					break;

				case 1:
					color_assign_c2 = m1_col.color_group;
					if (c2_ht !== m1_ht) {
						throw new Error(`Inconsistent HTs [c2,m1]: ${c2_ht} != ${m1_ht}`);
					}
					break;

				case 2:
					color_assign_c2 = m2_col.color_group;
					if (c2_ht !== m2_ht) {
						throw new Error(`Inconsistent HTs [c2,m2]: ${c2_ht} != ${m2_ht}`);
					}
					break;

				default:
					throw new Error('Invalid descent assignment');
			}
			c2_cls[index].color_group = color_assign_c2;
		}
	}
};
