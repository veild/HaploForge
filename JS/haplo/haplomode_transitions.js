var toggle_haplo = false,
	toggle_horiz = false,
	toggle_haplobutton = false,
	backg;


var transition_happening=false,
	backg;

// General Transitions for nodes and or groups of a given fam
// Assumes haplo_layer usage
function transitionToggle(fam_id, toggler, lineswitch=true, use_y=true, groupmove=true, onfinishfunc=0)
{
	var gen_lines = generation_grid_ids[fam_id],
		n_caa = unique_graph_objs[fam_id];

	var start_x = butt_w + nodeSize,
		start_y = grid_rezY/2;


	//	n_caa.group.moveToTop();
	linesShow(fam_id, false); 								// Hide lines during transition

	var num_movers = Object.keys(n_caa.nodes).length;

	var spacingx = (window.innerWidth - start_x) / num_movers;

	if (spacingx > max_haplo_x) spacingx = max_haplo_x;
	else if (spacingx < min_haplo_x) spacingx = min_haplo_x;

	for (var g=0; g < gen_lines.length; g++){
		for (var c=0; c < gen_lines[g].length; c++){
			var ch_id = gen_lines[g][c],
				n_chl = n_caa.nodes[ch_id],
				gfx = n_chl.graphics;

			n_chl.start_pos = n_chl.start_pos || [];
			var pos_loc = n_chl.start_pos,
				pos_pos;

			if (toggler) pos_loc.push( gfx.getPosition() );
			else pos_pos = pos_loc.pop();


			// Set animation
			var tween = new Kinetic.Tween({
				node: gfx,
				x: toggler?start_x:pos_pos.x,
				y: toggler?start_y:pos_pos.y,
				duration:0.8,								// Slightly faster than group
				easing: Kinetic.Easings.EaseIn
			});


			tween.play();
			start_x += spacingx;
		}
		if (use_y)
			start_y += (nodeSize*2)+6;
	}


	if (groupmove){
		var xx =20, yy= 50;

		// Add background rect when moving group, remove on restore
		n_caa.start_pos = n_caa.start_pos || [];

		if (toggler) n_caa.start_pos.push( n_caa.group.getPosition() );
		else {
			var pos1 = n_caa.start_pos.pop(); 				//Revert position

			xx = pos1.x; yy = pos1.y;
		}

		// Tween group
		var tt = new Kinetic.Tween({
			node: n_caa.group,
			x: xx, y: yy,
			duration: 1,  									// last slightly longer than child tweens
			onFinish: function(){
				linesShow(fam_id, true);
				touchlines(!toggler);
				transition_happening = false;
				if (onfinishfunc!=0) onfinishfunc();
				console.log("current_layer= "+n_caa.group.parent.attrs.id);
			},
			easing: Kinetic.Easings.EaseOut
		});
		tt.play();
		transition_happening = true;
	}
	else{
		//If group not moving, still call the lineShow switch
		linesShow(fam_id, lineswitch);
	}

	return {x:start_x, y:start_y};
}




// Start/Stop HaploMode
function toggle_haplomode(fam_id)
{
	if (transition_happening)
		return; 											// Ignore overclicks

	if (toggle_horiz) toggle_horizAlign(fam_id); 			// Unalign if aligned first
	if (toggle_haplobutton) toggle_haplotypes(fam_id);			// Hide Haplotypes if shown


	toggle_haplo = !toggle_haplo;

	var	n_caa     = unique_graph_objs[fam_id],
		grp       = n_caa.group;

	if (toggle_haplo){

		backg = new Kinetic.Rect({
			x:0, y:0,
			width: window.innerWidth,
			height: window.innerHeight,
			fill: 'black',
			opacity:0.5
		});
		grp.remove(); 										  // remove from parent but do not destroy;
		haplo_layer.add(grp); 								  // add to haplo

		var final_pos = transitionToggle(fam_id, toggle_haplo, lineswitch=true, use_y=true);

		console.log("1");
		var panel_a_scroll = addHaploScreen(final_pos.x, final_pos.y, fam_id);
		console.log("2");

		n_caa.haplo_panel  = panel_a_scroll[0]; 		// Entire panel
		n_caa.haplo_scroll = panel_a_scroll[1]; 		// Scroll window (stays stationary
		n_caa.haplo_area   = panel_a_scroll[2];  		// Haplotypes aregrouped (and draggable) here
		n_caa.haplo_pedbg  = panel_a_scroll[3]; 		// Rect background

		n_caa.group.add(n_caa.haplo_panel);
		n_caa.haplo_panel.moveToBottom();

		haplo_layer.add(backg);
	}
	else {
		n_caa.haplo_panel.remove();
		n_caa.haplo_panel.destroy();//

		var callback = function(){
			grp.remove(); 			  					  // remove from parent but do not destroy;
			main_layer.add(grp); 						  // add to main
			main_layer.draw();

//			haplo_layer.destroyChildren();
		}

		transitionToggle(fam_id, toggle_haplo, lineswitch=true, use_y=true, groupmove = true,
						 onfinishfunc=callback);

		backg.destroy();
	}
}


//Within haplomode
function toggle_horizAlign(fam_id)
{
	if (transition_happening) return; 						// Ignore overclicks
	toggle_horiz = !toggle_horiz;

	transitionToggle(fam_id, toggle_horiz, lineswitch=!toggle_horiz, use_y=false, groupmove=false);

	function boxlim (horizontal){
		var min_y = nodeSize*8; //starting point
		if (horizontal) return min_y;
		else
			return min_y + ((nodeSize*2)+5)*(generation_grid_ids[fam_id].length-1);
	}

	var end_y = boxlim(toggle_horiz);



	//Resize boxes dynamically:
	(new Kinetic.Tween({
		node: unique_graph_objs[fam_id].haplo_pedbg,
		height: end_y,
		duration: 1
	})).play();

	if (toggle_haplobutton){
		(new Kinetic.Tween({
			node: unique_graph_objs[fam_id].haplo_scroll,
			y: end_y,
			duration: 1
		})).play();
	}
}


//Within haplomode
function toggle_haplotypes(fam){
	toggle_haplobutton = !toggle_haplobutton;

	var scroll_panel_grp = unique_graph_objs[fam].haplo_area;

	if (!(fam in haplos_generated)){
		if (toggle_haplobutton){
			console.log("Haplos not generated for "+fam+", doing now...");
			addHaplos(fam, scroll_panel_grp);
		}
		else console.log("Haplos not generated, doing nothing");
		return;
	}

	toggle_haplobutton?scroll_panel_grp.show():scroll_panel_grp.hide();

// 	scroll_panel_grp.getChildren().each(
// 		function(n){
// 			toggle_haplobutton?scroll_panel_grp.add(n.haplo_group):n.haplo_group.remove();
// 		}
// 	);

	haplo_layer.draw();
}
