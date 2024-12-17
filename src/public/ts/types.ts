export interface SavedDot {
    x: string;
    y: string;
    coordinates: string;
    displayCoordinates?: string;
    label: string;
    id?: string;
    labelOffset?: {
        x: number;
        y: number;
    };
    lineLength?: number;
    lineAngle?: number;
}


export interface LabelPosition {
    x: number;
    y: number;
    angle: number;
    length: number;
}

export interface DotElements {
    dot: HTMLElement;
    label: HTMLElement;
    line: HTMLElement;
    coordinates: HTMLElement;
}

export interface Dot {
    x: string;
    y: string;
    coordinates: string;
    label: string;
    id?: string;
    labelOffset?: {
        x: number;
        y: number;
    };
    lineLength?: number;
    lineAngle?: number;
}

