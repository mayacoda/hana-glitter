"use strict";
exports.__esModule = true;
var hana_1 = require("./hana");
var random = require('canvas-sketch-util/random');
var canvasSketch = require('canvas-sketch');
var settings = {
    dimensions: [2480, 3508],
    name: 'triangles',
    suffix: "seed-" + random.getSeed(),
    attributes: {
        antialias: true
    },
    animate: true,
    context: 'webgl'
};
canvasSketch(hana_1.initCanvas, settings);
//# sourceMappingURL=canvas-sketch.js.map