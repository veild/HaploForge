/// DO NOT BOTHER TO CHAIN THE END OF ONE TWEEN TO THE START OF ANOTHER
// the onFinish function in the tweening stage executes only after a node
// has been launched, and it does not wait for it to finish.
//
// Rely on the more or less precise timings set by the setTimeout wrapper.

const FancyGraphics = {
	__start: null,
	__step: 50,
	__fromLeft: false,

	__initial: {
		scale: 50,
		x: -100,
		y: 2000,
		duration: 0.5
	},

	init() {
		//Reset
		FancyGraphics.__start = 0;
		FancyGraphics.__fromLeft = Math.round(Math.random()) === 0;
		FancyGraphics.__initial.y *= FancyGraphics.__fromLeft ? -1 : 1;

		//Init
		FancyGraphics.__placeFamText();
		FancyGraphics.__placeNodes();
		FancyGraphics.__placeLines();
	},

	__place(graphics, step) {
		const positions = {
			x: graphics.getX(),
			y: graphics.getY()
		};

		const initial = FancyGraphics.__initial;

		graphics.setScale({ x: initial.scale, y: initial.scale });
		graphics.setX(initial.x);
		graphics.setY(initial.y);
		graphics.moveToTop();

		setTimeout(() => {
			kineticTween({
				node: graphics,
				scaleX: 1,
				scaleY: 1,
				x: positions.x,
				y: positions.y,
				duration: initial.duration,
				easing: Kinetic.Easings.StrongEaseOut
			}).play();
		}, FancyGraphics.__start);

		// Stagger placement interval
		FancyGraphics.__start += step;
	},

	__placeFamText() {
		uniqueGraphOps.foreachfam((fid, fgroup) => {
			FancyGraphics.__place(fgroup.group, FancyGraphics.__step * 2);
		});
	},

	__placeNodes() {
		FancyGraphics.__start += 500; // pause

		uniqueGraphOps.foreachnode((pid, fid, node) => {
			node.graphics.show();
			FancyGraphics.__place(node.graphics, FancyGraphics.__step);
		});
	},

	__placeLines() {
		FancyGraphics.__start += 200; // pause

		const show_interval = FancyGraphics.__start + FancyGraphics.__initial.duration * 1000;

		// Hide all edges until nodes are placed
		uniqueGraphOps.foreachedge((eid, fid, edge) => {
			edge.graphics.hide();

			/*			setTimeout(function(){
				kineticTween({
					node:edge.graphics,
					visible: true,
					duration: 3
				});
			}, show_interval);*/
		});

		// Final touch
		setTimeout(() => {
			uniqueGraphOps.foreachedge((eid, fid, edge) => {
				edge.graphics.show();
			});

			touchlines();
			main_layer.draw();
		}, show_interval);
	}
};
