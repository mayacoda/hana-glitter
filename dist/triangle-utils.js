"use strict";
exports.__esModule = true;
var palettes = require('nice-color-palettes/100.json');
var random = require('canvas-sketch-util/random');
var lerp = require('canvas-sketch-util/math').lerp;
var SIN60 = Math.sin(60 * Math.PI / 180);
function getRandomPalette() {
    var palette = random.pick(palettes);
    palette = random.shuffle(palette);
    return palette;
}
exports.getRandomPalette = getRandomPalette;
function hashCodeFromTriangle(_a, _b, _c) {
    var u = _a[0], v = _a[1];
    var u1 = _b[0], v1 = _b[1];
    var u2 = _c[0], v2 = _c[1];
    var str = '' + u + v + u1 + v1 + u2 + v2;
    var hash = 0, i, chr;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}
exports.hashCodeFromTriangle = hashCodeFromTriangle;
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.toCoord = function () {
        return [this.x, this.y];
    };
    return Point;
}());
exports.Point = Point;
function UVToPoint(_a, _b) {
    var minX = _a.minX, maxX = _a.maxX, minY = _a.minY, maxY = _a.maxY;
    var u = _b[0], v = _b[1];
    var x = lerp(minX, maxX, u);
    var y = lerp(minY, maxY, v);
    return new Point(x, y);
}
exports.UVToPoint = UVToPoint;
function drawTriangle(context, constraints, _a, palette) {
    var uv1 = _a[0], uv2 = _a[1], uv3 = _a[2];
    var p1 = UVToPoint(constraints, uv1);
    var p2 = UVToPoint(constraints, uv2);
    var p3 = UVToPoint(constraints, uv3);
    context.moveTo(p1.x, p1.y);
    context.beginPath();
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.lineTo(p1.x, p1.y);
    context.closePath();
    var key = hashCodeFromTriangle(uv1, uv2, uv3);
    var localRandom = random.createRandom(key);
    context.fillStyle = localRandom.pick(palette);
    context.fill();
}
exports.drawTriangle = drawTriangle;
function distance(vec1, vec2) {
    var d = 0;
    for (var i = 0; i < vec1.length; i++) {
        var diff = vec1[i] - vec2[i];
        d += diff * diff;
    }
    return Math.sqrt(d);
}
exports.distance = distance;
function isInsideCircle(p1, p2, radius) {
    return distance(p1, p2) < radius;
}
exports.isInsideCircle = isInsideCircle;
function createGrid(count, aspect) {
    if (aspect === void 0) { aspect = 1; }
    var points = [];
    var xOffset = 0;
    var evenXOffset = 0.5;
    var oddXOffset = 0;
    var yAppend = Math.floor(count - count * SIN60);
    var yTotal = Math.floor((count + yAppend) / aspect);
    for (var x = 0; x < count; x++) {
        var row = [];
        points.push(row);
        for (var y = 0; y < yTotal; y++) {
            xOffset = y % 2 !== 0 ? evenXOffset : oddXOffset;
            var u = (x + xOffset) / (count - 1);
            var v = (y * SIN60 * aspect) / (count - 1);
            row.push([u, v]);
        }
    }
    return points;
}
exports.createGrid = createGrid;
function createTriangles(grid) {
    var triangles = [];
    for (var i = 0; i < grid.length; i++) {
        var column = grid[i];
        var nextColumn = grid[i + 1] || [];
        var previousColumn = grid[i - 1] || [];
        for (var j = 0; j < column.length; j++) {
            var point = column[j];
            var oneBelow = column[j + 1];
            var toTheRight = nextColumn[j];
            if (j % 2 === 0) {
                if (toTheRight && oneBelow)
                    triangles.push([point, toTheRight, oneBelow]);
                var lowerLeft = previousColumn[j + 1];
                if (oneBelow && lowerLeft)
                    triangles.push([point, oneBelow, lowerLeft]);
            }
            else {
                var lowerRight = nextColumn[j + 1];
                if (toTheRight && lowerRight)
                    triangles.push([point, toTheRight, lowerRight]);
                if (lowerRight && oneBelow)
                    triangles.push([point, lowerRight, oneBelow]);
            }
        }
    }
    return triangles;
}
exports.createTriangles = createTriangles;
function isTriangleInsideCircle(triangle, center, radius) {
    return isInsideCircle(triangle[0], center, radius) &&
        isInsideCircle(triangle[1], center, radius) &&
        isInsideCircle(triangle[2], center, radius);
}
exports.isTriangleInsideCircle = isTriangleInsideCircle;
//# sourceMappingURL=triangle-utils.js.map