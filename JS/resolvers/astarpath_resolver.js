const a_star_bestfirst__DEBUG = (array, exclude_list) => {
	// Define excludelist function
	let inExcludeList;

	if (
		exclude_list === undefined ||
		exclude_list.length === 0 // No list given
	)
		inExcludeList = item => false;
	else if (
		typeof exclude_list === 'number' // Single item given
	)
		inExcludeList = item => item === exclude_list;
	else if (exclude_list.length === 1) {
		// Single array item
		exclude_list = exclude_list[0];
		inExcludeList = item => item === exclude_list;
	} else // Whole list given
		inExcludeList = item => exclude_list.indexOf(item) !== -1;

	const end = array.length - 1;

	const MAX_ROUTES = 4; // maximum amount of working routes

	let exploring_routes = [ { array: [], numsets: 0 } ], // initial zero route
		complete_routes = [];

	let route_map = {}; // routes explored already

	let num_cycles = 0;

	// Initially discard any colors that stretch only for a single index
	let stretches_only = true;

	while (true) {
		while (exploring_routes.length !== 0) {
			num_cycles++;
			exploring_routes = exploring_routes
			.sort((a, b) => b.array.length - a.array.length)
				.slice(0, MAX_ROUTES);

			// Current open route
			const current_route = exploring_routes[0].array,
				  current_nsets = exploring_routes[0].numsets,
				  current_row = current_route.length;

			// Various routes at this row
			const num_colors = array[current_row].color_group.length;

			console.log('-Route:', current_route);
            console.log(`    current_row=${current_row}`);
			console.log('    num_colors =', num_colors);

			const ordered_routes = {};
			let zero_indexes = {};

			// Look ahead by one
			for (let c = 0; c < num_colors; c++) {
				const current_color = array[current_row].color_group[c];

				console.log(`    - trying color ${current_color}`);

				if (inExcludeList(current_color)) {
					console.log('    - EXCLUDE!');
					continue;
				}

				//Perform look ahead
				let stretch = current_row + 1;
				while (stretch <= end) {
					const new_colors = array[stretch].color_group;
					console.log(`       - testing ${current_color} against ${new_colors} @i ${stretch}`);

					// Only break on another non-zero group color
					if (new_colors.indexOf(current_color) === -1) {
						if (new_colors.length === 1 && new_colors[0] === FounderColor.zero_color_grp) {
							zero_indexes[stretch] = 0;
						} else {
							//not a zero group
							break;
						}
					}

					stretch++;
				}
				stretch -= current_row;

				console.log('    - stretches for ', stretch, 'before index', stretch + current_row);

				// Store color with key as the length of the stretch
				ordered_routes[stretch] = current_color;
			}
            const keys_rev_ord = Object.keys(ordered_routes).sort((a, b) => b - a);

			console.log('    ordered_routes=', ordered_routes);
			console.log('    reversed_order=', keys_rev_ord);

			// Add routes to current route
            for (const key of keys_rev_ord) {
				// No sig. change
				if (stretches_only && key <= 1) {
					// Dead end route
					console.log('    dead_end route, skipping');
					continue;
				}

				const new_r = current_route.slice(); //clone a new path for each fork

				let len = key;
				while (len-- > 0) new_r.push(ordered_routes[key]); // push the color k times

                console.log(`   - adding '${ordered_routes[key]}' ${key}x  to `, new_r);

				//Add the zeros
				for (const z_index in zero_indexes) {
					if (new_r.length > z_index) new_r[z_index] = FounderColor.zero_color_grp;
				}

				const new_pack = { array: new_r, numsets: current_nsets + 1 };
                const string_key = new_r.reduce((a, b) => `${a}${b}`);

				if (!(string_key in route_map)) {
					route_map[string_key] = 0;

					if (new_r.length === array.length)
						complete_routes.push(new_pack); // fin
					else exploring_routes.push(new_pack); // push the new path if unique
				}
			}

			// Remove old route (now expanded)
			exploring_routes.splice(0, 1);
			zero_indexes = {};

			console.log(`    explored=${exploring_routes.map(n => `[${n.array}] `)}`);
            console.log(`    complete=${complete_routes.map(n => `[${n.array}] `)}`);
		}

		// Do we have results?
		if (complete_routes.length === 0) {
			if (stretches_only) {
				stretches_only = false; // Next iter on array tries for single indexes
				console.log('repeating without stretches');

				// reset
				complete_routes = [];
				exploring_routes = [ { array: [], numsets: 0 } ];
				route_map = {};

				continue;
			}

			// console.error(arguments);

			// return a_star_bestfirst__DEBUG(array);
			return null;
		}
		break;
	}
	let best;

	if (complete_routes.length === 1) best = complete_routes[0].array;
	else
		best = complete_routes.sort((a, b) => a.numsets - b.numsets)[0].array;

	console.log('best_routes A*', complete_routes);
	console.log(' with best=', best);
	console.log(`  in ${num_cycles} cycles`);

	console.log(
		'SRC ARRAY=',
		array.map(a => `${a.color_group}`)
	);

	return best;
};

const starbest_body = ((() => {
	const entire = a_star_bestfirst__DEBUG.toString();

	return entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
}))();

const strre = starbest_body.replace(/console\.log\(.*\)\;/g, '');

const a_star_bestfirst = new Function('array', 'exclude_list', strre);

// var	array = [
// 	[4,2,6],
// 	[2,6],
// 	[2,7],
// 	[7],
// 	[4,7],
// 	[3,7]];

// var array = [
// 	[2,6],[2],[2,6],[2,6],[2],[2,6],[2],[2,6],[2],[2],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2],[2,6],[2],[2,6],[2,6],[2],[2],[2,6],[2],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2,6],[2],[2],[2,6],[2,6],[2,6],[2],[2,6],[2],[2],[2,6],[2,6],[2],[2,6],[2],[2,6],[2,6],[2,6],[2],[2,6],[2,6],[2,6],[2,6],[2],[2,6],[2]];

// array = array.map(function(n){return {color_group:n};});

// a_star_bestfirst__DEBUG(array,[]);
