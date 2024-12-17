export var PLANE_SIZE = 500; // Total size of plane in pixels
export var GRID_UNITS = 10; // Number of grid units (-5 to +5)
export var PIXELS_PER_UNIT = PLANE_SIZE / GRID_UNITS; // 40px per unit
export var COORDINATE_STEP = 0.1; // Desired movement granularity
export var TICK_COUNT = 11; // Number of tick marks on each axis
export var MOUSE_UPDATE_INTERVAL = 16; // ~60fps
export var DEBUG = false;
export var DOT_BOX = {
    MIN_WIDTH: 100,
    MIN_HEIGHT: 45,
    TOP_OFFSET: -23,
    LEFT_PADDING: 25,
    DOT_WIDTH: 6
};
// New label connection settings
export var LABEL_CONNECTION = {
    DEFAULT_LENGTH: 50, // Default length of connecting line in pixels
    LINE_COLOR: '#d1d5db', // Color of connecting line
    LINE_WIDTH: 1, // Width of connecting line
    BOX_BORDER_COLOR: '#e5e7eb',
    BOX_BACKGROUND: 'rgba(255, 255, 255, 0.95)',
    BOX_BORDER_WIDTH: 1,
    BOX_BORDER_RADIUS: 4,
    MIN_LINE_LENGTH: 20, // Minimum length of connecting line
    MAX_LINE_LENGTH: 150, // Maximum length of connecting line
    LINE_POSITION: {
        TOP: 'calc(50% + 0px)', // Positive moves down, negative moves up
        LEFT: 'calc(50% - 0px)' // Positive moves right, negative moves left
    }
};
