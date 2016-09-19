import { inkTextureSamples, textureSamplesLength } from './constants';
import { uniqueTextureFactor } from './helpers/semiRandomization';

export default class Texture {
	constructor(passedInkTextureBase, passedUniqueCanvasFactor) {
		this._inkTextureBase = passedInkTextureBase;
		this._textureSampleLocations = this._getSampleLocations();
		this._uniqueCanvasFactor = passedUniqueCanvasFactor;
		this.clear();
	}

	clear() {
		this._textureSampleStep = 0;
	}

	nextInkTextureSample() {
		// Get new texture sample offset at center	
		var t = inkTextureSamples[this._textureSampleStep];
		this._textureSampleStep = (this._textureSampleStep === this._textureSampleLocations.length - 1) ? 0 : (this._textureSampleStep + 1);
		return t;
	}

	setUniqueCanvasFactor(passedUniqueCanvasFactor) {
		this._uniqueCanvasFactor = passedUniqueCanvasFactor;
	}
	
	_getSampleLocations() {
		var img = this._getImageFromBase64(this._inkTextureBase, 'jpeg');
		var imageData = this._getImageDataFromImage(img);
		var imageDataGrays = [];
		var textureOffsetX = 0;
		var textureOffsetY = 0;
		var textureSampleLocations = [];

		// Read grays from image
		for(var i = 0; i < imageData.length; i+=4) {
			imageDataGrays.push(1 - imageData[i]/255);
		}

		// Read samples from mirrored-and-tiled grays
		for (let i = 0; i < textureSamplesLength; i++) {
			// Get normalized pixel within texture
			var T_s = textureOffsetX / (img.width - 1);
			var T_t = textureOffsetY / (img.height - 1);
			var s = Math.abs(Math.abs(T_s - 1) % 2 - 1);
			var t = Math.abs(Math.abs(T_t - 1) % 2 - 1);
			var x = Math.floor(s * (img.width - 1));
			var y = Math.floor(t * (img.height - 1));
			textureSampleLocations.push({x: x, y: y});
			var d = imageDataGrays[x + y * img.width];
			inkTextureSamples[i] = d;
			//samples[i] = 100 + Math.random()*155;
			
			// Step texture offset randomly [-1, 1]
			textureOffsetX += (uniqueTextureFactor(i, this._uniqueCanvasFactor) * 2 | 0) === 1 ? -1 : 1;
			textureOffsetY += (uniqueTextureFactor(i, this._uniqueCanvasFactor) * 2 | 0) === 1 ? -1 : 1;
		}

		return textureSampleLocations;
	}
	
	_getImageFromBase64(base64, type) {
		var img = new Image();
		img.src = 'data:image/' + type + ';base64, ' + base64;

		return img;
	}

	_getImageDataFromImage(img) {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img, 0, 0);
		return ctx.getImageData(0, 0, img.width, img.height).data;
	}
}

