
var HomologySelectionMode = {

	_exit : null,
	_active : false,

	init: function()
	{
		HomologySelectionMode._active = true;

		ButtonModes.setToHomologySelection();

		HomologySelectionMode.sub_select_group = null;   //destroyed by homology_buttons exit function
		HomologySelectionMode.__makeBackground();
		HomologySelectionMode.__addBounders();

		haplo_layer.add(HomologySelectionMode.sub_select_group);
		haplo_layer.draw();
	},

	__cleanup: function(){
		HomologySelectionMode.sub_select_group.rect.destroy();

		// Detach top back to normal haplowindow
		HaploWindow._top.moveTo( HaploWindow._group )

		HomologySelectionMode.sub_select_group.destroyChildren();
		HomologySelectionMode.sub_select_group.destroy();	
	},


	// HomologySelection --> HaploMode/Comparison	
	quit: function(){
		HomologySelectionMode._active = false;
		HomologySelectionMode.__cleanup();

		ButtonModes.setToComparisonMode();

		HaploWindow._exit.show();
		haplo_layer.draw();		
	},


	// Called by sidetool.js
	// HomologySelection --> HomologyMode
	submit: function()
	{
		ButtonModes.setToHomologyMode();

		HomologyMode.selected_for_homology = [];
	
		for (var s in SelectionMode._items){
			if (SelectionMode._items[s].selected)
			{
				SelectionMode._items[s].box.stroke('green')
				HomologyMode.selected_for_homology.push(s);
			}
			SelectionMode._items[s].box.off('click');
		}

		HomologySelectionMode.__cleanup();
		HomologySelectionMode._exit.hide();

		haplo_layer.draw();

		if (HomologyMode.selected_for_homology.length === 0){
			utility.notify("Info", "Please select individuals for analysis");
			return -1;
		}


		HomologyPlot.plots = scan_alleles_for_homology( HomologyMode.selected_for_homology );

		HomologyMode.init();

		HomologyMode.redraw();

		return 0;
	},


	__makeBackground: function()
	{
		// Main selection layer
		HomologySelectionMode.sub_select_group = new Kinetic.Group({
			x:0, y:0,
			width: stage.getWidth(),
			height: stage.getHeight()
		});

		HomologySelectionMode.sub_select_group.rect = new Kinetic.Rect({
			x:0, y:0,
			width: stage.getWidth(),
			height: stage.getHeight(),
			fill: 'black',
			strokeWidth: 0,
			opacity: 0.2
		});

		HomologySelectionMode.sub_select_group.add(
			HomologySelectionMode.sub_select_group.rect
		);

		// Destroyed on quit();
		HomologySelectionMode._exit = addExitButton(
			{x: 20,
			 y: 40},
			 HomologySelectionMode.quit,
			 2
		);
		HomologySelectionMode.sub_select_group.add( HomologySelectionMode._exit );


		// Shift top panel to front layer
		HaploWindow._top.moveTo( HomologySelectionMode.sub_select_group )
		HaploWindow._exit.hide();
	},


	__addBounders: function()
	{
		//Clear previous SelectionMode._items
		SelectionMode._items = {};

		for (var c=0; c < DOS.haplo_group_nodes.children.length; c++)
		{
			var node = DOS.haplo_group_nodes.children[c];

			if (node == 0) continue;

			var key = node.attrs.id,
				gfx = node,
				pos = gfx.getAbsolutePosition(),
				bounder = SelectionGraphics.addBounder(pos, key, false, null); // false -> haplo_layer, null --> testHaplos

			// By default not enabled
			SelectionMode._items[key] = {
				box:bounder,
				selected:false,
				graphics: gfx
			};
			HomologySelectionMode.sub_select_group.add(bounder);
		}
	},
}
