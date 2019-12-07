import {initCanvas} from "./hana";

const random = require('canvas-sketch-util/random');
const canvasSketch = require('canvas-sketch');

const settings = {
    dimensions: [2480, 3508],
    name: 'triangles',
    suffix: `seed-${random.getSeed()}`,
    attributes: {
        antialias: true
    },
    animate: true,
    context: 'webgl'
};

canvasSketch(initCanvas, settings);
