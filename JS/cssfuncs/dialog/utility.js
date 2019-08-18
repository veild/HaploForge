const messProps = {
	_header: document.getElementById('message_head'),
	_text: document.getElementById('message_text'),
	_exit: document.getElementById('message_exit'),
	_box: document.getElementById('message_props'),
	_buttonrow: document.getElementById('message_buttonsrow'),
	_yes: document.getElementById('message_yes'),
	_no: document.getElementById('message_no'),
	_inputrow: document.getElementById('message_inputrow'),
	_input: document.getElementById('message_input'),
	_submit: document.getElementById('message_submit'),

	_aftercallbacks() {
		this.hide();
		utility.hideBG();
		this._inputrow.style.display = 'block';
		this._text.style.display = 'block';
	},

	hide() {
		Keyboard.unpause();
		this._box.style.display = 'none';
		this._box.style.zIndex = -99;
	},

	show() {
		Keyboard.pause();
		this._box.style.display = 'block';
		this._box.style.zIndex = 502;
		this._input.focus();
	},

	display(header, text, exit_callback = null, yes_no_object = null, submit = false) {
		this.show();

		// must occur after this.show();
		utility.showBG(() => {
			messProps.hide();
		});

		this._header.innerHTML = header;
		this._text.innerHTML = text;

		/* On Exit */
		this._exit.onclick = () => {
			if (exit_callback !== null) {
				exit_callback();
			}
			messProps._aftercallbacks();
		};

		/*Submit */
		if (submit) {
			this._buttonrow.style.display = 'none';
			this._inputrow.style.display = 'block';

			this._submit.value = 'Submit';
			const that = this;
			this._submit.onclick = () => {
				submit(that._input.value);
				that._exit.onclick();
			};
		}

		/* Yes No*/
		if (yes_no_object === null) {
			this._buttonrow.style.display = 'none';
			this._no.value = this._yes.value = '';
			this._no.onclick = this._yes.onclick = null;
		} else {
			/* Input box */
			this._buttonrow.style.display = 'block';
			this._inputrow.style.display = 'none';

			if (yes_no_object.yes !== null) {
				this._yes.value = yes_no_object.yes;
				this._yes.onclick = () => {
					yes_no_object.yescallback();
					messProps._aftercallbacks();
				};
			}

			if (yes_no_object.no !== null) {
				this._no.value = yes_no_object.no;
				this._no.onclick = () => {
					yes_no_object.nocallback();
					messProps._aftercallbacks();
				};
			}
		}
	},

	prompt(header, text, yes, onYes, no, onNo) {
		const promptcallback = {
			yes: yes,
			yescallback: onYes,
			no: no,
			nocallback: onNo
		};

		this._inputrow.style.display = 'none';
		this.display(header, text, null, promptcallback, false);
	},

	input(header, callback) {
		this._text.style.display = 'none';
		this._text.value = '';

		const that = this;

		that.display(header, '', null, null, callback);
		/*function(val){
			console.log(val);
			callback(val.innerHTML);
			//messProps._aftercallbacks();
		});*/
	}

	/* do not use
	inputMulti(header, input_html, submit_callback){
		// input_array : [label,input obj]
		this._text.style.display = "none";
		this._text.value = "";

		this._buttonrow._old_html = this._buttonrow.innerHTML;  //
		this._buttonrow.innerHTML = input_html; 				//

		var that = this;

		that.display(header, "", 
			function exit(){
				//restore
				that._buttonrow.innerHTML = that._buttonrow._old_html
				delete that._buttonrow._old_html;
			}, null, submit_callback
		);
	}*/
};

const statusProps = {
	_box: document.getElementById('status_props'),
	_header: document.getElementById('status_head'),
	_message: document.getElementById('status_text'),

	hide() {
		this._box.style.display = 'none';
	},
	show() {
		this._box.style.display = 'block';
		this._box.style.opacity = 1;
		this._box.style.zIndex = 503;
	},

	_fade(step = 30) {
		let op = 1;
		const timer = setInterval(() => {
			if (op < 0.1) {
				clearInterval(timer);
				statusProps.hide();
			}
			statusProps._box.style.opacity = op;
			op -= 0.1;
		}, step);
	},

	display(header, details, timeUntilFade = 1.5, fadeStep = 50) {
		// Don't change to "this", because utility.notify defers what 'this' is
		statusProps.show();

		statusProps._header.innerHTML = header;
		statusProps._message.innerHTML = details;

		setTimeout(() => {
			statusProps._fade(fadeStep);
		}, timeUntilFade * 1000);
	}
};

const utility = {
	_bg: document.getElementById('modal_bg'),

	focus() {
		this.focus();
	},

	yesnoprompt(title, message, yes, onYes, no, onNo) {
		// Own method drop in?
		messProps.prompt(title, message, yes, onYes, no, onNo);
	},

	inputprompt(title, callback) {
		messProps.input(title, callback);
	},

	notify: statusProps.display,

	getMouseXY() {
		return stage.getPointerPosition();
	},

	showBG(callback = null) {
		utility._bg.style.display = 'block';

		// This property is not updated until later, so showBG
		// MUST be called AFTER the messProps._box is set to visible.
		const messZ = messProps._box.style.zIndex;
		utility._bg.style.zIndex = messZ; /// get Zindex of messPrompt solid

		if (callback !== null) {
			utility._bg.onclick = () => {
				callback();
				utility.hideBG();
				utility._bg.onclick = null;
			};
		}
	},

	hideBG() {
		this._bg.style.display = 'none';
		this._bg.style.zIndex = -99;
	}
};
