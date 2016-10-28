// export const paperColorLight = 'rgb(255, 255, 246)';
export const paperColorDark = 'rgb(240, 235, 219)';
// export const paperColorMedium = 'rgb(250, 240, 230)';

export const defaultPenColor = { r: 0, g: 0, b: 0 };

export const defaultFilterWeight = 0.5;
export const defaultStepInterval = 0.3;
export const defaultSample = 2;

export const textureSamplesLength = 1e5;
export const inkTextureSamples = new Float32Array(textureSamplesLength);

export const inkTextureBase64 = require('raw!./resources/inkTextureBase64.txt');