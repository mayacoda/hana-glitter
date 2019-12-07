"use strict";
exports.__esModule = true;
var triangle_utils_1 = require("./triangle-utils");
function hexToRGB(hex) {
    if (hex.charAt(0) === '#') {
        hex = hex.substr(1);
    }
    var values = hex.split('');
    var r = parseInt(values[0].toString() + values[1].toString(), 16);
    var g = parseInt(values[2].toString() + values[3].toString(), 16);
    var b = parseInt(values[4].toString() + values[5].toString(), 16);
    return [r / 256, g / 256, b / 256, 1];
}
exports.hexToRGB = hexToRGB;
function rgbToYUV(_a) {
    var r = _a[0], g = _a[1], b = _a[2], a = _a[3];
    var y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    var u = Math.round((((b - y) * 0.493) + 111) / 222 * 255);
    var v = Math.round((((r - y) * 0.877) + 155) / 312 * 255);
    return [y, u, v, a];
}
exports.rgbToYUV = rgbToYUV;
function compareHex(hex1, hex2) {
    return triangle_utils_1.distance(rgbToYUV(hexToRGB(hex1)), rgbToYUV(hexToRGB(hex2)));
}
exports.compareHex = compareHex;
function containsEnough(palette, color) {
    var scores = [];
    for (var i = 0; i < palette.length; i++) {
        scores.push(compareHex(palette[i], color));
    }
    var average = scores.reduce(function (acc, curr) {
        acc += curr;
        return acc;
    }, 0) / scores.length;
    var max = Math.max.apply(Math, scores);
    return average < 0.2;
}
exports.containsEnough = containsEnough;
function sortByBrightness(palette) {
    return palette.sort(function (colorA, colorB) {
        var valueA = hexToRGB(colorA).reduce(function (acc, val) { return acc += val; });
        var valueB = hexToRGB(colorB).reduce(function (acc, val) { return acc += val; });
        return valueB - valueA;
    });
}
exports.sortByBrightness = sortByBrightness;
//# sourceMappingURL=color-utils.js.map