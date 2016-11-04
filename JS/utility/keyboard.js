//Keyboard

var Keyboard = {
	
	__map : {
		"Control" : false,
		"Shift": false,
		"ArrowDown": false,
		"ArrowUp" : false,
		"PageDown" : false,
		"PageUp" : false
	},

	__listening: 0, 
	//smart pointer 
	    // --> at zero it stops listening
	    //     increments for each beginListen

	dn_tasks : {},  // keydn --> function()
	up_tasks : {},    // keyup --> function()

	__beginListen(){
		document.addEventListener("keydown", Keyboard.__processKeyDown, false);
		document.addEventListener("keyup", Keyboard.__processKeyUp, false);
	},

	__endListen(){
		document.removeEventListener("keydown", Keyboard.__processKeyDown, false);
		document.removeEventListener("keyup", Keyboard.__processKeyUp, false);
	},

	beginListen(){
//		console.log("KEYBOARD", Keyboard.__listening)

		if (Keyboard.__listening === 0){
			Keyboard.__beginListen();
			//console.log("keyboard listening")
		}
		Keyboard.__listening += 1;
	},

	endListen(){
//		Keyboard.__listening -= 1;
		
		if (Keyboard.__listening > 0){
			Keyboard.__endListen();
			Keyboard.__listening = 0;
		}
//		console.log("KEYBOARD", Keyboard.__listening)
	},

	// Pausing is useful for input entering operations.
	pause_state: null,

	pause(){
		Keyboard.pause_state = Keyboard.__listening
		Keyboard.__endListen();
	},

	unpause(){
		if (Keyboard.pause_state > 0){
			Keyboard.__beginListen();
		}
		Keyboard.pause_state = null;
	},

	__processKeyDown(event){
		Keyboard.__map[event.key] = true;

		console.log(event.key);

		if (event.key in Keyboard.dn_tasks){
			Keyboard.dn_tasks[event.key]();
		}
	},

	__processKeyUp(event){
		Keyboard.__map[event.key] = false;

		if (event.key in Keyboard.up_tasks){
			Keyboard.up_tasks[event.key]();
		}
	},


	//  -- Key tasks
	addKeyPressTask(key, func, modifier_key = null){

		if (key in Keyboard.dn_tasks){
			throw new Error("This will override the down AND up tasks for "+ key);
		}

		Keyboard.dn_tasks[key] = function(){
			func.pressed = true;
		};

		Keyboard.up_tasks[key] = function(){

			if (modifier_key !== null){
				if (!(Keyboard.isPressed( modifier_key ))){
					return -1;
				}
			}

			if (func.pressed){
				func();
			}
			func.pressed = false;
		};
	},

	removeKeyPressTask(key){
		if (key in Keyboard.dn_tasks){
			delete Keyboard.dn_tasks[key];
			delete Keyboard.up_tasks[key];
			return 0;
		}
		throw new Error(key + " not in down tasks (or up tasks)?");
	},

	addKeyUpTask(key, func){
		if (key in Keyboard.up_tasks){
			throw new Error("This will override the up task for "+key);
		}
		Keyboard.up_tasks[key] = func;
	},

	removeKeyUpTask(key){
		if (key in Keyboard.up_tasks){
			delete Keyboard.up_tasks[key];
			return 0;
		}
		throw new Error(key+" not in keyup tasks");
	},


	addKeyDownTask(key, func){
		if (key in Keyboard.dn_tasks){
			throw new Error("This will override the down task for "+key);
		}
		Keyboard.dn_tasks[key] = func;
	},

	removeKeyDownTask(key){
		if (key in Keyboard.dn_tasks){
			delete Keyboard.dn_tasks[key];
			return 0;
		}
		console.error(key+" not in keydown tasks");
	},



	isPressed(key){
		if (key in Keyboard.__map){
			return Keyboard.__map[key];
		}
		// otherwise insert it and set false
		Keyboard.__map[key] = false;
		return false
	},

	isShiftDown(){
		return Keyboard.isPressed("Shift");
	},


	isCtrlDown(){
		return Keyboard.isPressed("Control");
	},	

}