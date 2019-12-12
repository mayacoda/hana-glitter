import {distance} from "./triangle-utils";

export function hexToRGB(hex: string): [number, number, number, number] {
    if (hex.charAt(0) === '#') {
        hex = hex.substr(1);
    }

    const values = hex.split('');
    const r = parseInt(values[0].toString() + values[1].toString(), 16);
    const g = parseInt(values[2].toString() + values[3].toString(), 16);
    const b = parseInt(values[4].toString() + values[5].toString(), 16);

    return [r / 256, g / 256, b / 256, 1]
}

export function rgbToYUV([r, g, b, a]: number[]): number[] {
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const u = Math.round((((b - y) * 0.493) + 111) / 222 * 255);
    const v = Math.round((((r - y) * 0.877) + 155) / 312 * 255);
    return [y, u, v, a];
}

export function compareHex(hex1: string, hex2: string) {
    return distance(rgbToYUV(hexToRGB(hex1)), rgbToYUV(hexToRGB(hex2)))
}

export function containsEnough(palette: string[], color: string) {
    const scores: number[] = [];
    for (let i = 0; i < palette.length; i++) {
        scores.push(compareHex(palette[i], color))
    }

    const average = scores.reduce((acc, curr) => {
        acc += curr;
        return acc;
    }, 0) / scores.length;

    const max = Math.max(...scores);

    return average < 0.2;
}

export function sortByBrightness(palette: string[]) {
    return palette.sort((colorA, colorB) => {
        const valueA = hexToRGB(colorA).reduce((acc, val) => acc += val );
        const valueB = hexToRGB(colorB).reduce((acc, val) => acc += val );

        return valueB - valueA;
    })
}
