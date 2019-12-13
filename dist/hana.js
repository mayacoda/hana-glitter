"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var triangle_utils_1 = require("./triangle-utils");
var color_utils_1 = require("./color-utils");
var load = require('load-asset');
var random = require('canvas-sketch-util/random');
var glsl = require('glslify');
var createRegl = require('regl');
random.setSeed(random.getRandomSeed());
var PALETTE;
var BACKGROUND;
var POINTS = [];
var COLORS = [];
var TRIANGLES = [];
var regl;
var POSITION_BUFFER;
var COLOR_BUFFER;
var CENTER_BUFFER;
var frag = glsl("\n\n    precision mediump float;\n\n    varying vec4 vColor;\n    varying float vRandomNoise;\n\n    uniform vec4 backgroundColor;\n    uniform float time;\n\n    void main() {\n        vec4 color;\n\n        float brightness = smoothstep(-0.8, 1.0, sin((time + 10.0) * vRandomNoise * 10.0) + 1.0);\n        color = mix(backgroundColor, vColor, brightness);\n\n        gl_FragColor = color;\n    }\n");
var vert = glsl("\n    precision mediump float;\n\n    attribute vec2 position;\n    attribute vec4 color;\n    attribute vec3 normal;\n    attribute vec2 center;\n\n    uniform float width, height;\n    uniform float randomNoise;\n    uniform float time;\n\n    varying float vRandomNoise;\n    varying vec4 vColor;\n\n    float rand(vec2 co){\n        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43.5453);\n    }\n\n    void main() {\n        float aspect = width / height;\n        vec2 worldPosition = 2.0 * vec2((position.x - 0.5), (position.y - 0.5));\n        vec2 worldCenter = vec2(2.0 * (center.x - 0.5), 2.0 * (center.x - 0.5));\n\n        vColor = color;\n        vRandomNoise = rand(center);\n\n        gl_Position = vec4(worldPosition.xy, 0, 1);\n    }\n");
var maskFrag = glsl("\n    precision mediump float;\n    uniform sampler2D texture;\n    uniform sampler2D allowedTexture;\n    uniform vec4 backgroundColor;\n    varying vec2 uv;\n\n    vec4 red = vec4(1.0, 0.0, 0.0, 1.0);\n    vec4 green = vec4(0.0, 1.0, 0.0, 1.0);\n    vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);\n\n    void main() {\n        vec4 color = texture2D(texture, uv);\n        vec4 allowedColor = texture2D(allowedTexture, uv);\n        if (color.r > 0.5 && allowedColor.a < .8) {\n            discard;\n        }\n\n        gl_FragColor = mix(gl_FragColor, allowedColor, allowedColor.a);\n    }\n");
var textureVert = glsl("\n    precision mediump float;\n    attribute vec2 position;\n    varying vec2 uv;\n\n    void main() {\n        uv = position;\n        vec2 pos = (1.0 - 2.0 * position);\n        gl_Position = vec4(-pos.x, pos.y, 0, 1);\n    }\n");
function initPalette() {
    var hexPalette = color_utils_1.sortByBrightness(triangle_utils_1.getRandomPalette());
    PALETTE = hexPalette.map(function (c) { return color_utils_1.hexToRGB(c); });
    BACKGROUND = PALETTE.shift();
    return hexPalette;
}
function initColors() {
    var hexPalette = initPalette();
    COLORS = TRIANGLES.map(function (_) {
        var index = random.rangeFloor(0, PALETTE.length - 1);
        var color = PALETTE[index];
        return [color, color, color];
    });
    COLOR_BUFFER({
        data: COLORS
    });
    return hexPalette;
}
exports.initColors = initColors;
exports.initCanvas = function (_a) {
    var canvas = _a.canvas, gl = _a.gl, width = _a.width, height = _a.height, image = _a.image, mask = _a.mask;
    return __awaiter(_this, void 0, void 0, function () {
        var count, centers, maskTexture, hanaTexture, drawTriangles, drawMask;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    count = 60;
                    initPalette();
                    gl = canvas.getContext('webgl');
                    canvas.height = height;
                    canvas.width = width;
                    if (!!image) return [3, 2];
                    return [4, load("../assets/hana.png")];
                case 1:
                    image = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!!mask) return [3, 4];
                    return [4, load("../assets/hana_mask.png")];
                case 3:
                    mask = _a.sent();
                    _a.label = 4;
                case 4:
                    POINTS = triangle_utils_1.createGrid(count, width / height);
                    TRIANGLES = triangle_utils_1.createTriangles(POINTS).filter(function (triangle) {
                        var localRandom = random;
                        var amplitude = localRandom.value();
                        return localRandom.noise2D(triangle[0][0], triangle[0][1], 20, amplitude) > 0.1;
                    });
                    COLORS = TRIANGLES.map(function (_) {
                        var color = random.pick(PALETTE);
                        return [color, color, color];
                    });
                    centers = TRIANGLES.map(function (_a) {
                        var _b = _a[0], x = _b[0], y = _b[1], _c = _a[1], x2 = _c[0], y2 = _c[1], _d = _a[2], x3 = _d[0], y3 = _d[1];
                        var center = [(x + x2 + x3) / 3, (y + y2 + y3) / 3];
                        return [center, center, center];
                    });
                    regl = createRegl({ gl: gl });
                    maskTexture = regl.texture(mask);
                    hanaTexture = regl.texture(image);
                    POSITION_BUFFER = regl.buffer(TRIANGLES);
                    COLOR_BUFFER = regl.buffer(COLORS);
                    CENTER_BUFFER = regl.buffer(centers);
                    drawTriangles = regl({
                        frag: frag,
                        vert: vert,
                        attributes: {
                            position: POSITION_BUFFER,
                            color: COLOR_BUFFER,
                            center: CENTER_BUFFER
                        },
                        uniforms: {
                            backgroundColor: BACKGROUND,
                            time: regl.prop('time'),
                            width: width,
                            height: height
                        },
                        count: TRIANGLES.length * 3
                    });
                    drawMask = regl({
                        vert: textureVert,
                        frag: maskFrag,
                        uniforms: {
                            texture: maskTexture,
                            allowedTexture: hanaTexture,
                            backgroundColor: BACKGROUND
                        },
                        attributes: {
                            position: [
                                -2, 0,
                                0, -2,
                                2, 2
                            ]
                        },
                        count: 3
                    });
                    regl.frame(function (_a) {
                        var time = _a.time;
                        regl.clear({
                            color: BACKGROUND,
                            depth: 1
                        });
                        drawMask();
                        drawTriangles({ time: time });
                    });
                    return [2];
            }
        });
    });
};
//# sourceMappingURL=hana.js.map