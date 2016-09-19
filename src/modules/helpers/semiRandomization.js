export function uniquePixelFactor(x, y, uniqueCanvasFactor) {
	return (((Math.sin(x) + 1) / 2) + ((Math.sin(y) + 1) / 2) + uniqueCanvasFactor) / 3;
}

export function uniqueTextureFactor(textureIndex, uniqueCanvasFactor) {
	return Math.sin(uniqueCanvasFactor + textureIndex);
}