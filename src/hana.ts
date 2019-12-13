import {Triangle} from "./interfaces";
import {createGrid, createTriangles, getRandomPalette,} from './triangle-utils';
import {hexToRGB, sortByBrightness} from "./color-utils";
import * as REGL from "regl";

const load = require('load-asset');
const random = require('canvas-sketch-util/random');
const glsl = require('glslify');
const createRegl = require('regl');

random.setSeed(random.getRandomSeed());
let PALETTE;
let BACKGROUND;
let POINTS = [];
let COLORS = [];
let TRIANGLES = [];
let regl: REGL.Regl;

let POSITION_BUFFER: REGL.Buffer;
let COLOR_BUFFER: REGL.Buffer;
let CENTER_BUFFER: REGL.Buffer;

// language=GLSL
const frag = glsl(`

    precision mediump float;

    varying vec4 vColor;
    varying float vRandomNoise;

    uniform vec4 backgroundColor;
    uniform float time;

    void main() {
        vec4 color;

        float brightness = smoothstep(-0.8, 1.0, sin((time + 10.0) * vRandomNoise * 10.0) + 1.0);
        color = mix(backgroundColor, vColor, brightness);

        gl_FragColor = color;
    }
`);

// language=GLSL
const vert = glsl(`
    precision mediump float;

    attribute vec2 position;
    attribute vec4 color;
    attribute vec3 normal;
    attribute vec2 center;

    uniform float width, height;
    uniform float randomNoise;
    uniform float time;

    varying float vRandomNoise;
    varying vec4 vColor;

    float rand(vec2 co){
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43.5453);
    }

    void main() {
        float aspect = width / height;
        vec2 worldPosition = 2.0 * vec2((position.x - 0.5), (position.y - 0.5));
        vec2 worldCenter = vec2(2.0 * (center.x - 0.5), 2.0 * (center.x - 0.5));

        vColor = color;
        vRandomNoise = rand(center);

        gl_Position = vec4(worldPosition.xy, 0, 1);
    }
`);

// language=GLSL
const maskFrag = glsl(`
    precision mediump float;
    uniform sampler2D texture;
    uniform sampler2D allowedTexture;
    uniform vec4 backgroundColor;
    varying vec2 uv;

    vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
    vec4 green = vec4(0.0, 1.0, 0.0, 1.0);
    vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);

    void main() {
        vec4 color = texture2D(texture, uv);
        vec4 allowedColor = texture2D(allowedTexture, uv);
        if (color.r > 0.5 && allowedColor.a < .8) {
            discard;
        }

        gl_FragColor = mix(gl_FragColor, allowedColor, allowedColor.a);
    }
`);

// language=GLSL
const textureVert = glsl(`
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;

    void main() {
        uv = position;
        vec2 pos = (1.0 - 2.0 * position);
        gl_Position = vec4(-pos.x, pos.y, 0, 1);
    }
`);


function initPalette() {
    const hexPalette = sortByBrightness(getRandomPalette());

    PALETTE = hexPalette.map(c => hexToRGB(c));
    BACKGROUND = PALETTE.shift();

    return hexPalette;
}

export function initColors() {
    const hexPalette = initPalette();

    COLORS = TRIANGLES.map(_ => {
        const index = random.rangeFloor(0, PALETTE.length - 1);
        let color = PALETTE[index];
        return [color, color, color];
    });

    COLOR_BUFFER({
        data: COLORS
    });

    return hexPalette;
}

export const initCanvas = async ({canvas, gl, width, height, image, mask}) => {
    const count = 60;
    initPalette();

    gl = canvas.getContext('webgl');

    canvas.height = height;
    canvas.width = width;

    if (!image) {
        image = await load(`../assets/hana.png`);
    }

    if (!mask) {
        mask = await load(`../assets/hana_mask.png`);
    }

    POINTS = createGrid(count, width / height);

    TRIANGLES = createTriangles(POINTS).filter((triangle: Triangle) => {
        const localRandom = random;
        let amplitude = localRandom.value();
        return localRandom.noise2D(triangle[0][0], triangle[0][1], 20, amplitude) > 0.1
    });

    COLORS = TRIANGLES.map(_ => {
        let color = random.pick(PALETTE);
        return [color, color, color];
    });

    const centers = TRIANGLES.map(([[x, y], [x2, y2], [x3, y3]]) => {
        const center = [(x + x2 + x3) / 3, (y + y2 + y3) / 3];
        return [center, center, center];
    });

    regl = createRegl({gl});

    const maskTexture = regl.texture(mask);
    const hanaTexture = regl.texture(image);

    POSITION_BUFFER = regl.buffer(TRIANGLES);
    COLOR_BUFFER = regl.buffer(COLORS);
    CENTER_BUFFER = regl.buffer(centers);

    type TriangleProps = { time: number };
    const drawTriangles = regl({
        frag,
        vert,
        attributes: {
            position: POSITION_BUFFER,
            color: COLOR_BUFFER,
            center: CENTER_BUFFER
        },
        uniforms: {
            backgroundColor: BACKGROUND,
            time: regl.prop<TriangleProps, 'time'>('time'),
            width,
            height
        },
        count: TRIANGLES.length * 3,
    });

    const drawMask = regl({
        vert: textureVert,
        frag: maskFrag,
        uniforms: {
            texture: maskTexture,
            allowedTexture: hanaTexture,
            backgroundColor: BACKGROUND,
        },
        attributes: {
            position: [
                -2, 0,
                0, -2,
                2, 2]
        },
        count: 3
    });

    regl.frame(({time}) => {

        regl.clear({
            color: BACKGROUND,
            depth: 1
        });

        drawMask();
        drawTriangles({time});
    });
};
