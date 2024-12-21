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

export interface DotElements {
    dot: HTMLElement;
    label: HTMLElement;
    line: HTMLElement;
    coordinates: HTMLElement;
}

export interface DotState {
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

export interface DotStateChange {
    dotId: string;
    previousState: DotState;
    newState: DotState;
}

export interface LabelPosition {
    x: number;
    y: number;
    angle: number;
    length: number;
}

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

export interface TPF {
    skipGraphClick: boolean;
    isDragging: boolean;
    debug: boolean;
    offsetX: number;
    offsetY: number;
    currentDot: HTMLDivElement | null | undefined;
    selectedDot: HTMLDivElement | null;
    xAxisWidth: number;
    yAxisHeight: number;
    lastMouseUpdate?: number;
    isLabelBoxDragging: boolean;
    currentLabelBox: HTMLDivElement | null;
    labelBoxOffset: { x: number; y: number };
}

export interface UndoAction {
    type: 'move' | 'delete' | 'create' | 'labelMove' | 'groupMove';
    dotId?: string;
    previousState?: DotState;
    newState?: DotState;
    groupedMoves?: DotStateChange[];
}