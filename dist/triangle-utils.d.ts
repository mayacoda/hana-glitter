import { Coord, Triangle } from "./interfaces";
export declare function getRandomPalette(): any;
export declare function hashCodeFromTriangle([u, v]: [any, any], [u1, v1]: [any, any], [u2, v2]: [any, any]): number;
export declare class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
    toCoord(): Coord;
}
export declare function UVToPoint({minX, maxX, minY, maxY}: {
    minX: any;
    maxX: any;
    minY: any;
    maxY: any;
}, [u, v]: [any, any]): Point;
export declare function drawTriangle(context: any, constraints: any, [uv1, uv2, uv3]: [any, any, any], palette: any): void;
export declare function distance(vec1: number[], vec2: number[]): number;
export declare function isInsideCircle(p1: Coord, p2: Coord, radius: any): boolean;
export declare function createGrid(count: number, aspect?: number): any[];
export declare function createTriangles(grid: Coord[][]): Triangle[];
export declare function isTriangleInsideCircle(triangle: Triangle, center: Coord, radius: number): boolean;
