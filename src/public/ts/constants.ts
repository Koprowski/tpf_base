export const PLANE_SIZE = 350;  // Total size of plane in pixels
export const GRID_UNITS = 10;   // Number of grid units (-5 to +5)
export const PIXELS_PER_UNIT = PLANE_SIZE / GRID_UNITS;  // 40px per unit
export const COORDINATE_STEP = 0.1;  // Desired movement granularity

export const TICK_COUNT = 11; // Number of tick marks on each axis
export const MOUSE_UPDATE_INTERVAL = 16; // ~60fps
export const DEBUG = false;
export const DOT_BOX = {
    MIN_WIDTH: 100,
    MIN_HEIGHT: 45,
    TOP_OFFSET: -23,
    LEFT_PADDING: 25,
    DOT_WIDTH: 6
} as const;

// New label connection settings
export const LABEL_CONNECTION = {
    DEFAULT_LENGTH: 50,  // Default length of connecting line in pixels
    LINE_COLOR: '#d1d5db',  // Color of connecting line
    LINE_WIDTH: 1,       // Width of connecting line
    BOX_BORDER_COLOR: '#e5e7eb',
    BOX_BACKGROUND: 'rgba(255, 255, 255, 0.95)',
    BOX_BORDER_WIDTH: 1,
    BOX_BORDER_RADIUS: 4,
    MIN_LINE_LENGTH: 20,  // Minimum length of connecting line
    MAX_LINE_LENGTH: 150,  // Maximum length of connecting line
    LINE_POSITION: {
        TOP: 'calc(50% + 0px)', // Positive moves down, negative moves up
        LEFT: 'calc(50% - 0px)' // Positive moves right, negative moves left
    }
} as const;