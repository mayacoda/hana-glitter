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

        float brightness = smoothstep(-1.0, 1.0, sin((time + 10.0) * vRandomNoise * 10.0) + 1.0);
        color = mix(backgroundColor, vColor, brightness);

        gl_FragColor = color;
    }
`);

// language=GLSL
const vert = glsl(`
    precision mediump float;

    //
    // Description : Array and textureless GLSL 2D simplex noise function.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : ijm
    //     Lastmod : 20110822 (ijm)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    //

    vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec3 permute(vec3 x) {
        return mod289(((x*34.0)+1.0)*x);
    }

    float snoise(vec2 v)
    {
        const vec4 C = vec4(0.211324865405187, // (3.0-sqrt(3.0))/6.0
        0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
        -0.577350269189626, // -1.0 + 2.0 * C.x
        0.024390243902439);// 1.0 / 41.0
        // First corner
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);

        // Other corners
        vec2 i1;
        //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
        //i1.y = 1.0 - i1.x;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        // x0 = x0 - 0.0 + 0.0 * C.xx ;
        // x1 = x0 - i1 + 1.0 * C.xx ;
        // x2 = x0 - 1.0 + 2.0 * C.xx ;
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;

        // Permutations
        i = mod289(i);// Avoid truncation effects in permutation
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));

        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m*m;
        m = m*m;

        // Gradients: 41 points uniformly over a line, mapped onto a diamond.
        // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;

        // Normalise gradients implicitly by scaling m
        // Approximation of: m *= inversesqrt( a0*a0 + h*h );
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

        // Compute final noise value at P
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    attribute vec2 position;
    attribute vec4 color;
    attribute vec3 normal;
    attribute vec2 center;

    uniform float width, height;

    varying vec4 vColor;
    varying float vRandomNoise;

    float random (vec2 st) {
        return (snoise(st) + 1.0) / 2.0;
    }

    void main() {
        float aspect = width / height;
        vec2 worldPosition = 2.0 * vec2((position.x - 0.5), (position.y - 0.5));
        vec2 worldCenter = vec2(2.0 * (center.x - 0.5), 2.0 * (center.x - 0.5));

        vColor = color;
        vRandomNoise = random(center);

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
