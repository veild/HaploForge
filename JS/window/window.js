// Singleton

function onWindowLoad() {
	(function browserDetection() {
		//
		//Quick browser detector
		//
		navigator.sayswho = ((() => {
            const ua = navigator.userAgent;
            let tem;
            let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
			if (/trident/i.test(M[1])) {
				tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
				return [ 'IE', tem[1] || '' ];
			}
			if (M[1] === 'Chrome') {
				tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
				if (tem != null) return [ tem.slice(1) ]; //.join(' ').replace('OPR', 'Opera');
			}
			M = M[2] ? [ M[1], M[2] ] : [ navigator.appName, navigator.appVersion, '-?' ];
			if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
			return M; //M.join(' ');
        }))();

		const browser_name = navigator.sayswho[0],
			  browser_vers = navigator.sayswho[1];

        const browser_flag = false;

		function exit(status) {
			let i;
			document.getElementById('content').innerHTML = `<head>${status}</head><body></body>`;

			function stopPropagation(e) {
				e.stopPropagation();
			}
			window.addEventListener(
				'error',
				e => {
					e.preventDefault();
					e.stopPropagation();
				},
				false
			);

			const handlers = [
				'copy',
				'cut',
				'paste',
				'beforeunload',
				'blur',
				'change',
				'click',
				'contextmenu',
				'dblclick',
				'focus',
				'keydown',
				'keypress',
				'keyup',
				'mousedown',
				'mousemove',
				'mouseout',
				'mouseover',
				'mouseup',
				'resize',
				'scroll',
				'DOMNodeInserted',
				'DOMNodeRemoved',
				'DOMNodeRemovedFromDocument',
				'DOMNodeInsertedIntoDocument',
				'DOMAttrModified',
				'DOMCharacterDataModified',
				'DOMElementNameChanged',
				'DOMAttributeNameChanged',
				'DOMActivate',
				'DOMFocusIn',
				'DOMFocusOut',
				'online',
				'offline',
				'textInput',
				'abort',
				'close',
				'dragdrop',
				'load',
				'paint',
				'reset',
				'select',
				'submit',
				'unload'
			];

			for (i = 0; i < handlers.length; i++) {
				window.addEventListener(
					handlers[i],
					e => {
						stopPropagation(e);
					},
					true
				);
			}
			if (window.stop) {
				window.stop();
			}
			throw '';
		}

		if (
			!(
				(browser_name === 'Chrome' && browser_vers >= 43) ||
				(browser_name === 'Firefox' && browser_vers >= 38) ||
				(browser_name === 'Safari' && browser_vers >= 9)
			)
		) {
			console.log(browser_name, browser_vers);
			let text = `
<h1 style="color: #111; font-family: 'Helvetica Neue', sans-serif; font-size: 100px; font-weight: bold; letter-spacing: -1px; line-height: 1; text-align: center;" >
    NOPE.
</h1>
<h2 style="color: #111; font-family: 'Open Sans', sans-serif; font-size: 30px; font-weight: 300; line-height: 32px; margin: 0 0 72px; text-align: center;" >
    Not This Browser.<br/>
    Not In A Million Years.<br/><br/>
    Try
    <a style='color:DarkOrange;text-decoration:none;font-family:"Arial",sans-serif;' href="https://www.mozilla.org/en-US/firefox/new/" >
        Firefox
    </a>
    or
    <a style='color:DodgerBlue;text-decoration:none;font-family:"Arial",sans-serif;' href="http://chromium.woolyss.com/">
        Chromium.
    </a><br/>
    <div style='font-size:12px;'>
        Chrome/Opera/Safari (if you must...)
    </div>
</h2>

<p style="text-align: center">
If you believe your browser should be supported, then please write an angry
<a href="mailto:mtekman89@gmail.com?subject=Support My Damn Browser!">
    email
</a>
or lodge an
<a href="https://github.com/mtekman/HaploForge/issues/new?title=Support%20My%20Damn%20Browser!">
    issue
</a>
on github.
</p>
`;
			exit(text);
		}
	})();

	// Define all load modes here
	//document.getElementById('user_tooltips').checked = userOpts.retrieve('showTooltips');
	document.getElementById('user_fancy').checked = userOpts.retrieve('fancyGraphics');
	userOpts.setGraphics();
	Settings.init();

	//setTimeout(function(){
	//    Test.HaploMode.run();
	//}, 1000);
}

onWindowLoad(); // singleton in a singleton is frowned upon
