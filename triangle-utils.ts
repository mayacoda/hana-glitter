import {Coord, Triangle} from "./interfaces";

const palettes = require('nice-color-palettes/100.json');
const random = require('canvas-sketch-util/random');
const {lerp} = require('canvas-sketch-util/math');

const SIN60 = Math.sin(60 * Math.PI / 180);

export function getRandomPalette() {
    let palette = random.pick(palettes);
    palette = random.shuffle(palette);
    return palette
}

export function hashCodeFromTriangle([u, v], [u1, v1], [u2, v2]) {
    const str = '' + u + v + u1 + v1 + u2 + v2;
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export class Point {
    constructor(public x: number, public y: number) {
    }

    toCoord(): Coord {
        return [this.x, this.y];
    }
}

export function UVToPoint({minX, maxX, minY, maxY}, [u, v]) {
    const x = lerp(minX, maxX, u);
    const y = lerp(minY, maxY, v);

    return new Point(x, y)
}


export function drawTriangle(context, constraints, [uv1, uv2, uv3], palette) {
    const p1 = UVToPoint(constraints, uv1);
    const p2 = UVToPoint(constraints, uv2);
    const p3 = UVToPoint(constraints, uv3);

    context.moveTo(p1.x, p1.y);
    context.beginPath();
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.lineTo(p1.x, p1.y);
    context.closePath();

    let key = hashCodeFromTriangle(uv1, uv2, uv3);
    const localRandom = random.createRandom(key);

    context.fillStyle = localRandom.pick(palette);
    context.fill();
}

export function distance(vec1: number[], vec2: number[]) {
    let d = 0;
    for (let i = 0; i < vec1.length; i++) {
        const diff = vec1[i] - vec2[i];
        d += diff * diff;
    }

    return Math.sqrt(d);
}

export function isInsideCircle(p1: Coord, p2: Coord, radius) {
    return distance(p1, p2) < radius
}

export function createGrid(count: number, aspect = 1) {
    const points = [];
    let xOffset = 0;
    const evenXOffset = 0.5;
    const oddXOffset = 0;
    const yAppend = Math.floor(count - count * SIN60);
    const yTotal = Math.floor((count + yAppend) / aspect);

    for (let x = 0; x < count; x++) {
        const row = [];
        points.push(row);
        for (let y = 0; y < yTotal; y++) {
            xOffset = y % 2 !== 0 ? evenXOffset : oddXOffset;

            const u = (x + xOffset) / (count - 1);
            const v = (y * SIN60 * aspect) / (count - 1);
            row.push([u, v]);
        }
    }
    return points;
}


// from [[u, v]] returns [ Point1, Point2, Point3 ] CW triangle
export function createTriangles(grid: Coord[][]): Triangle[] {
    const triangles: Triangle[] = [];
    // columns
    for (let i = 0; i < grid.length; i++) {
        const column = grid[i];
        const nextColumn = grid[i + 1] || [];
        const previousColumn = grid[i - 1] || [];
        // rows
        for (let j = 0; j < column.length; j++) {
            const point = column[j];
            let oneBelow = column[j + 1];
            let toTheRight = nextColumn[j];
            // even rows
            if (j % 2 === 0) {
                if (toTheRight && oneBelow) triangles.push([point, toTheRight, oneBelow]);

                const lowerLeft = previousColumn[j + 1];
                if (oneBelow && lowerLeft) triangles.push([point, oneBelow, lowerLeft]);
                // odd rows
            } else {
                const lowerRight = nextColumn[j + 1];
                if (toTheRight && lowerRight) triangles.push([point, toTheRight, lowerRight]);

                if (lowerRight && oneBelow) triangles.push([point, lowerRight, oneBelow]);
            }
        }
    }

    return triangles;
}

export function isTriangleInsideCircle(triangle: Triangle, center: Coord, radius: number) {
    return isInsideCircle(triangle[0], center, radius) &&
        isInsideCircle(triangle[1], center, radius) &&
        isInsideCircle(triangle[2], center, radius);
}
