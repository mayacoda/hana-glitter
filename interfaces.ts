
export type Coord = [number, number]
export type Triangle = [Coord, Coord, Coord]

export interface Props {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;
    time: number;
    playhead: number;
}
