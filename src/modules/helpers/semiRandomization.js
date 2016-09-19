export function uniquePixelFactor(x, y, uniqueCanvasFactor) {
	return uniqueCanvasFactor === undefined ? Math.random() : (((Math.sin(x) + 1) / 2) + ((Math.sin(y) + 1) / 2) + uniqueCanvasFactor) / 3;
}

export function uniqueTextureFactor(textureIndex, uniqueCanvasFactor) {
	return uniqueCanvasFactor === undefined ? Math.random() : Math.sin(uniqueCanvasFactor + textureIndex);
}