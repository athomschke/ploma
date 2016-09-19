import Point from './Point';
import Texture from './Texture';
import last from 'lodash/last';
import { uniquePixelFactor } from './helpers/semiRandomization';

export default class BezierDrawer {

	constructor(passedCanvas, passedInkTextureBase, passedPenColor, passedStepInterval, passedUniqueCanvasFactor) {
		this._canvas = passedCanvas;
		this._ctx = this._canvas.getContext('2d');
		this._texture = new Texture(passedInkTextureBase, passedUniqueCanvasFactor);
		this._penR = passedPenColor.r;
		this._penG = passedPenColor.g;
		this._penB = passedPenColor.b;
		this._stepInterval = passedStepInterval;
		this._uniqueCanvasFactor = passedUniqueCanvasFactor;
		this.reset();
	}

	reset() {
		this._lastControlPoint = null;
		this._imageData = null;
		this._w = null;
		this._h = null;
		this._stepOffset = this._stepInterval;
		this._texture.clear();
	}

	drawControlPoints(pt0, pt1, pt2) {
		this._cacheVariables();
		this._createAndDrawBezier(pt0, pt1, pt2);
	}

	_cacheVariables() {
		this._w = this._w || this._canvas.getAttribute('width');
		this._h = this._h || this._canvas.getAttribute('height');
		this._imageData = this._imageData || this._ctx.getImageData(0, 0, this._w, this._h);
	}

	// ------------------------------------------
	// createAndDrawBezier
	//
	// Draw a look-ahead cubic bezier based on 3
	// input points.
	//
	_createAndDrawBezier(pt0, pt1, pt2) {
		// Endpoints and control points
		var p0 = pt0;
		var p1 = 0.0;
		var p2 = 0.0;
		var p3 = pt1;

		// Value access
		var p0_x = p0.x;
		var p0_y = p0.y;
		var p0_p = p0.p;
		var p3_x = p3.x;
		var p3_y = p3.y;
		var p3_p = p3.p;

		// Calculate p1
		if(!this._lastControlPoint) {
			p1 = new Point(
				p0_x + (p3_x - p0_x) * 0.33,
				p0_y + (p3_y - p0_y) * 0.33,
				p0_p + (p3_p - p0_p) * 0.33
			);
		} else {
			p1 = this._lastControlPoint.getMirroredPt(p0);
		}

		// Calculate p2
		if (pt2) {
			p2 = new Point(
				//p3_x - (((p3_x - p0_x) + (pt2.x - p3_x)) / 6),
				//p3_y - (((p3_y - p0_y) + (pt2.y - p3_y)) / 6),
				//p3_p - (((p3_p - p0_p) + (pt2.p - p3_p)) / 6)
				p3_x - (((p3_x - p0_x) + (pt2.x - p3_x)) * 0.1666),
				p3_y - (((p3_y - p0_y) + (pt2.y - p3_y)) * 0.1666),
				p3_p - (((p3_p - p0_p) + (pt2.p - p3_p)) * 0.1666)
			);
		} else {
			p2 = new Point(
				p0_x + (p3_x - p0_x) * 0.66,
				p0_y + (p3_y - p0_y) * 0.66,
				p0_p + (p3_p - p0_p) * 0.66
			);
		}

		// Set last control point
		this._lastControlPoint = p2;

		// Step along curve and draw step
		var stepPoints = this._calculateStepPoints(p0, p1, p2, p3);
		for(var i = 0; i < stepPoints.length; i++) {
			this._drawStep(this._imageData.data, stepPoints[i]);
		}

		// Calculate redraw bounds
		// TODO:
		// - Math.min = x <= y ? x : y; INLINE
		var p1_x = p1.x;
		var p1_y = p1.y;
		var p2_x = p2.x;
		var p2_y = p2.y;
		var minx = Math.min(p0_x, p1_x, p2_x, p3_x);
		var miny = Math.min(p0_y, p1_y, p2_y, p3_y);
		var maxx = Math.max(p0_x, p1_x, p2_x, p3_x);
		var maxy = Math.max(p0_y, p1_y, p2_y, p3_y);

		// Put image using a crude dirty rect
		//elapsed = Date.now() - elapsed;
		//console.log(elapsed);
		this._ctx.putImageData(
			this._imageData,
			0,
			0,
			minx - 5,
			miny - 5,
			(maxx - minx) + 10,
			(maxy - miny) + 10
		);
	}

	// ------------------------------------------
	// calculateStepPoints
	//
	// Calculates even steps along a bezier with
	// control points (p0, p1, p2, p3).
	//
	_calculateStepPoints(p0, p1, p2, p3) {
		var stepPoints = [];
		var i = this._stepInterval;

		// Value access
		var p0_x = p0.x;
		var p0_y = p0.y;
		var p0_p = p0.p;

		// Algebraic conveniences, not geometric
		var A_x = p3.x - 3 * p2.x + 3 * p1.x - p0_x;
		var A_y = p3.y - 3 * p2.y + 3 * p1.y - p0_y;
		var A_p = p3.p - 3 * p2.p + 3 * p1.p - p0_p;
		var B_x = 3 * p2.x - 6 * p1.x + 3 * p0_x;
		var B_y = 3 * p2.y - 6 * p1.y + 3 * p0_y;
		var B_p = 3 * p2.p - 6 * p1.p + 3 * p0_p;
		var C_x = 3 * p1.x - 3 * p0_x;
		var C_y = 3 * p1.y - 3 * p0_y;
		var C_p = 3 * p1.p - 3 * p0_p;

		var t = (i - this._stepOffset) / Math.sqrt(C_x * C_x + C_y * C_y);

		while (t <= 1.0) {
			// Point
			var step_x = t * (t * (t * A_x + B_x) + C_x) + p0_x;
			var step_y = t * (t * (t * A_y + B_y) + C_y) + p0_y;
			var step_p = t * (t * (t * A_p + B_p) + C_p) + p0_p;
			stepPoints.push(new Point(
				step_x,
				step_y,
				step_p
			));

			// Step distance until next one
			var s_x = t * (t * 3 * A_x + 2 * B_x) + C_x; // dx/dt
			var s_y = t * (t * 3 * A_y + 2 * B_y) + C_y; // dy/dt
			var s = Math.sqrt(s_x * s_x + s_y * s_y); // s = derivative in 2D space
			var dt = i / s; // i = interval / derivative in 2D
			t = t + dt;
		}

		// TODO: Maybe use a better approximation for distance along the bezier?
		if (stepPoints.length == 0) // We didn't step at all along this Bezier
			this._stepOffset = this._stepOffset + p0.getDistance(p3);
		else
			this._stepOffset = last(stepPoints).getDistance(p3);

		return stepPoints;
	}

	// ------------------------------------------
	// calculateWidth
	//
	// Calculates a non-linear width offset in
	// the range [-2, 1] based on pressure.
	//
	_calculateWidth(p) {
		var width = 0.0;
		//console.log(p);

		if(p < 0) { // Possible output from bezier
			width = -3.50;
		}
		if(p < 0.2) {
			width = this._map(p, 0, 0.2, -3.50, -3.20);
		} 
		if((p >= 0.2) && (p < 0.45)) {
			width = this._map(p, 0.2, 0.45, -3.20, -2.50);
		}
		if((p >= 0.45) && (p < 0.8)) {
			width = this._map(p, 0.45, 0.8, -2.50, -1.70);
		}
		if((p >= 0.8) && (p < 0.95)) {
			width = this._map(p, 0.8, 0.95, -1.70, -1.55);
		}
		if((p >= 0.95) && (p <= 1)) {
			width = this._map(p, 0.95, 1, -1.55, -1.30);
		}
		if(p > 1) { // Possible output from bezier
			width = -1.30;
		}

		return width;
	}

	_map(value, valueMin, valueMax, from, to) {
		let ratio = (value - valueMin) / (valueMax - valueMin);
		return from + ratio * (to - from);
	}

	// ------------------------------------------
	// drawStep
	//
	// Draws a 5x5 pixel grid at a step point
	// with proper antialiasing and texture.
	//
	_drawStep(imageDataData, point) {

		/////////////////////
		// PRE-LOOP
		/////////////////////

		var width = 0.0;
		width = this._calculateWidth(point.p);

		/////////////////////
		// LOOP
		/////////////////////

		var p_x = 0.0;
		var p_y = 0.0;
		var p_p = 0.0;
		var centerX = 0.0;
		var centerY = 0.0;
		var i = 0;
		var j = 0;
		var left = 0;
		var right = 0;
		var top = 0;
		var bottom = 0; 
		var dx = 0.0;
		var dy = 0.0;
		var dist = 0.0;
		var a = 0.0;
		var invA = 0.0;
		var idx_0 = 0;
		var idx_1 = 0;
		var idx_2 = 0;
		var idx_3 = 0;
		var idx_0_i = 0;
		var oldR = 0.0;
		var oldG = 0.0;
		var oldB = 0.0;
		var oldA = 0.0;
		var newR = 0.0;
		var newG = 0.0;
		var newB = 0.0;
		var newA = 0.0;

		p_x = point.x;
		p_y = point.y;
		p_p = point.p;
		centerX = Math.round(p_x);
		centerY = Math.round(p_y);
		left = centerX - 2;
		right = centerX + 3;
		top = centerY - 2;
		bottom = centerY + 3;

		// Step around inside the texture before the loop
		//textureSampleStep = (textureSampleStep === textureSampleLocations.length - 1) ? 0 : (textureSampleStep + 1);

		//////////////
		// Horizontal
		//////////////
		for(i = left; i < right; i++) {

			// Distance
			dx = p_x - i;

			// Byte-index
			idx_0_i = i * 4;

			////////////
			// Vertical
			////////////
			for(j = top; j < bottom; j++) {

				// Distance
				dy = p_y - j;
				dist = Math.sqrt(dx * dx + dy * dy);

				// Byte-index
				idx_0 = idx_0_i + j * ( this._w * 4 );

				// Antialiasing
				//a = 5 * ((0.3 / (dist - width)) - 0.085);
				a = (1.5 / (dist - width)) - 0.425;

				// Spike
				if(dist < width) {
					a = 1;
				}
				
				// Clamp alpha
				if (a < 0) a = 0;
				if (a >= 1) a = 1;

				// Apply texture
				a *= this._texture.nextInkTextureSample();

				// Grain
				var g = this._map(p_p, 0, 1, 0.8, 0.95);
				var prob = 1-(p_p*p_p*p_p*p_p*p_p); // 1 - x^4
				g = Math.floor(uniquePixelFactor(i, j, this._uniqueCanvasFactor)*prob*2) === 1 ? 0 : g;
				a *= g;

				// Blending vars
				invA = 1 - a;
				idx_1 = idx_0 + 1;
				idx_2 = idx_0 + 2;
				idx_3 = idx_0 + 3;
				oldR = imageDataData[idx_0];
				oldG = imageDataData[idx_1];
				oldB = imageDataData[idx_2];

				oldA = imageDataData[idx_3] / 255;

				if (oldA === 1) {
					newR = this._penR * a + oldR * invA;
					newG = this._penG * a + oldG * invA;
					newB = this._penB * a + oldB * invA;
				} else {
					newA = a + oldA * invA;
					newR = (this._penR * a + oldR * oldA * invA) / newA;
					newG = (this._penG * a + oldG * oldA * invA) / newA;
					newB = (this._penB * a + oldB * oldA * invA) / newA;
					newA = newA * 255;
					// Set new A
					imageDataData[idx_3] = newA;
				}


				// Set new RGB
				imageDataData[idx_0] = newR;
				imageDataData[idx_1] = newG;
				imageDataData[idx_2] = newB;

			}
		}
	}
}
