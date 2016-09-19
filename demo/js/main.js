
require([
	// Load our app module and pass it to our definition function
	'../index.js'
], function(
	Ploma
){

	// DOM
	var canvas;
	var save;
	var clear;
	var cursor;
	var plugin;
	var penAPI;
	var uniqueCanvasFactorInput;

	// State
	var sampling = 2;
	var ballpointPen = null;
	var isDrawing = false;

	// Red Pixel
	var r = new Uint8ClampedArray(16);
	var rid;
	r[0] = 255;
	r[3] = 255;
	r[4] = 255;
	r[7] = 255;
	r[8] = 255;
	r[11] = 255;
	r[12] = 255;
	r[15] = 255;

	// load DOM elements
	canvas = document.getElementById('canvas');
	canvas.setAttribute('width', window.innerWidth);
	canvas.setAttribute('height', window.innerHeight);
	save = document.getElementById('save');
	clear = document.getElementById('clear');
	cursor = document.getElementById('cursor');
	plugin = document.getElementById('wtPlugin');
	uniqueCanvasFactorInput = document.getElementById('uniqueCanvasFactor');
	penAPI = plugin.penAPI || {
		pressure: 0.9
	};

	//mode.innerHTML = sampling;
	//texture.innerHTML = "T";

	// populate red pixel
	rid = canvas.getContext('2d').createImageData(2, 2);
	rid.data.set(r);

	// load Ploma onto canvas and clear it
	ballpointPen = new Ploma.BallpointPen(canvas);

	////////////
	// BUTTONS
	////////////
	save.onclick = function() {
		window.open(canvas.toDataURL());
	};
	
	clear.onclick = function() {
		ballpointPen.clear();
	};
	
	uniqueCanvasFactorInput.onchange = function() {
		var value = parseFloat(uniqueCanvasFactorInput.value);
		ballpointPen.setUniqueCanvasFactor(value > 0 && value <= 1? value : undefined);
		if (value > 0 && value <= 1) {
			uniqueCanvasFactorInput.classList.remove('random');
		} else {
			uniqueCanvasFactorInput.classList.add('random');
		}
	};

	cursor.onclick = function() {
		// TODO: UPDATE CHECKBOX OR IMAGE ON BUTTON
		if(canvas.style.cursor === 'none') {
			document.getElementById('cursor-icon').setAttribute('src', 'img/cursor-24.png');
			canvas.style.cursor = 'crosshair';
		} else {
			document.getElementById('cursor-icon').setAttribute('src', 'img/cursor-24-75.png');
			canvas.style.cursor = 'none';
		}
	};

	////////////
	// RESIZE
	////////////
	window.onresize = function() {
		ballpointPen.resize(window.innerWidth, window.innerHeight);
	};

	///////////////////////////////////
	// MOUSE EVENT
	///////////////////////////////////
	canvas.onmousedown = function(e) {
		isDrawing = true;
		if (sampling === 0) return;
		ballpointPen.beginStroke(
			e.clientX,
			e.clientY,
			penAPI.pressure ? penAPI.pressure : 0.9
		);
	};

	canvas.onmousemove = function(e) {
		if (!isDrawing) return;
		if (sampling === 0) {
			canvas.getContext('2d').putImageData(
				rid,
				e.clientX,
				e.clientY,
				0,
				0,
				2,
				2
			);
			return;
		}
		ballpointPen.extendStroke(
			e.clientX,
			e.clientY,
			penAPI.pressure ? penAPI.pressure : 0.9
		);
	};

	canvas.onmouseup = function(e) {
		isDrawing = false;
		if (sampling === 0) return;
		ballpointPen.endStroke(
			e.clientX,
			e.clientY,
			penAPI.pressure ? penAPI.pressure : 0.9
		);
	};

});