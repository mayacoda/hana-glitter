import {Triangle} from "./interfaces";
import {createGrid, createTriangles, getRandomPalette,} from './triangle-utils';
import {hexToRGB, sortByBrightness} from "./color-utils";

const load = require('load-asset');
const random = require('canvas-sketch-util/random');
const glsl = require('glslify');
const createRegl = require('regl');

random.setSeed(random.getRandomSeed());

let PALETTE = sortByBrightness(getRandomPalette());
PALETTE.forEach(color => {
    console.log(`%c ${color}`, `background: ${color}`);
});

// language=GLSL
const frag = glsl(`

    precision mediump float;

    varying vec4 vColor;
    varying float vRandomNoise;

    uniform vec4 backgroundColor;
    uniform float time;

    void main() {
        vec4 color;

        float brightness = smoothstep(0.6, 1.0, sin((time + 10.0) * vRandomNoise) + 1.0);
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

    varying vec4 vColor;
    varying float vRandomNoise;

    float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233)))*43758.5453123);
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

export const initCanvas = async ({canvas, gl, width, height, image, mask}) => {
    const count = 40;
    const background = hexToRGB(PALETTE[1]);
    gl = canvas.getContext('webgl');

    canvas.height = height;
    canvas.width = width;

    if (!image) {
        image = await load(`assets/hana.png`);
    }

    if (!mask) {
        mask = await load(`assets/hana_mask.png`);
    }

    const points = createGrid(count, width / height);
    const triangles = createTriangles(points).filter((triangle: Triangle) => {
        const localRandom = random;
        let amplitude = localRandom.value();
        return localRandom.noise2D(triangle[0][0], triangle[0][1], 20, amplitude) > 0.1
    });

    const colors = triangles.map(_ => {
        let color = hexToRGB(random.pick(PALETTE));
        return [color, color, color];
    });

    const centers = triangles.map(([[x, y], [x2, y2], [x3, y3]]) => {
        const center = [(x + x2 + x3) / 3, (y + y2 + y3) / 3];
        return [center, center, center];
    });

    const regl = createRegl({gl});

    const maskTexture = regl.texture(mask);
    const hanaTexture = regl.texture(image);

    const positionBuffer = regl.buffer(triangles);
    const colorBuffer = regl.buffer(colors);
    const centerBuffer = regl.buffer(centers);

    regl.frame(({time}) => {

        regl.clear({
            color: background,
            depth: 1
        });

        const drawTriangles = regl({
            frag,
            vert,
            attributes: {
                position: positionBuffer,
                color: colorBuffer,
                center: centerBuffer
            },
            uniforms: {
                backgroundColor: background,
                time,
                width,
                height
            },
            count: triangles.length * 3,
        });

        const drawMask = regl({
            vert: textureVert,
            frag: maskFrag,
            uniforms: {
                texture: maskTexture,
                allowedTexture: hanaTexture,
                backgroundColor: background,
            },
            attributes: {
                position: [
                    -2, 0,
                    0, -2,
                    2, 2]
            },
            count: 3
        });

        drawMask();

        drawTriangles();

        gl.flush();
    })
};
