

class TutorialActions {

	static getNumTutorials(){
		TutorialActions.__numTutorials = TutorialActions.__numTutorials || 0;
		return TutorialActions.__numTutorials;
	}

	static incrementNumTutorials(){
		TutorialActions.__numTutorials = (TutorialActions.__numTutorials || 0) + 1;
	}

	static decrementNumTutorials(){
		TutorialActions.__numTutorials--;
	}


	constructor( exitfunction ){
		this._onexit = exitfunction;
		this._currentpage = 0;

		TutorialActions.incrementNumTutorials();

		BackgroundVidMain.removeVid(); /*Ttorials stop other videos while running */

		Keyboard.layerOn("tutorial");
		Keyboard.addKeyPressTask("ArrowLeft", this.backwardPage.bind(this));
		Keyboard.addKeyPressTask("ArrowRight", this.forwardPage.bind(this));
		Keyboard.addKeyPressTask("Escape", this.quit.bind(this));
	}


	static __buttonVisibility(button, visible){
		button.style.display = visible?"block":"none";
		button.style.zIndex = visible?2:-1;
	}
	static __isButtonVisible(button){
		return button.style.display !== "none";
	}

	backwardVisible(vis){ TutorialActions.__buttonVisibility(this.back, vis);}
	forwardVisible(vis){  TutorialActions.__buttonVisibility(this.forw, vis);}
	
	quit(){
		Keyboard.layerOff();

		this.destroy();

		if (this._onexit !== null){
			this._onexit();
		}
		TutorialActions.decrementNumTutorials();
		BackgroundVidMain.addVid();

	}

	forwardPage(){
		if (!TutorialActions.__isButtonVisible(this.forw)){
			return 0; //not visible, do nothing
		}

		var len  = this._pages.length,
			next = this._currentpage + 1;

		this.forwardVisible(next !== len - 1) // If next page is last, hide forward
		this.backwardVisible(true);

		this._currentpage = next;
		this.__hidepage(this._currentpage - 1);
		this.__showpage(this._currentpage);
	}

	backwardPage(){
		if (!TutorialActions.__isButtonVisible(this.back)){
			return 0; //not visible, do nothing
		}


		var prev = this._currentpage - 1;

		this.backwardVisible(prev !== 0);
		this.forwardVisible(true) 

		this._currentpage = prev;
		this.__hidepage(this._currentpage + 1);
		this.__showpage(this._currentpage );
	}

	__hidepage(pageno){this.___setpage(pageno,false)};
	__showpage(pageno){this.___setpage(pageno,true)};
	___setpage(pageno, visible)
	{
		var page = this._pages[pageno],
			plot = this.__tps[pageno];

		if (page === undefined){
			console.log("Invalid page", pageno);
			return -1
		}


		if (visible){
			console.log(plot);
			if (plot.enterAction !== null){plot.enterAction();}
			page.style.display = "block";
		}
		else {
			if (plot.exitAction !== null){plot.exitAction();}
			page.style.display = "none";
		}
	}
}
