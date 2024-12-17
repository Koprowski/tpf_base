import { PLANE_SIZE, PIXELS_PER_UNIT } from './constants';
import log from "./util.log";
export function createTickMarks(xyPlane) {
    log('createTickMarks');
    var TICK_COUNT = 11;
    var SEGMENT_SIZE = PLANE_SIZE / (TICK_COUNT - 1);
    // First, remove any existing x-label elements
    var existingLabels = Array.from(xyPlane.getElementsByClassName('x-label'));
    existingLabels.forEach(function (label) { return label.remove(); });
    function createTicks(isXAxis) {
        var positions = Array.from({ length: TICK_COUNT }, function (_, i) { return i * SEGMENT_SIZE; });
        var existingTicks = Array.from(xyPlane.getElementsByClassName(isXAxis ? 'x-tick' : 'y-tick'));
        existingTicks.forEach(function (tick) { return tick.remove(); });
        positions.forEach(function (pos, index) {
            var tick = document.createElement('div');
            var classes = [isXAxis ? 'x-tick' : 'y-tick'];
            if (index === 5) {
                classes.push('center-tick');
            }
            tick.className = classes.join(' ');
            if (isXAxis) {
                tick.style.left = "".concat(pos, "px");
            }
            else {
                tick.style.top = "".concat(pos, "px");
            }
            xyPlane.appendChild(tick);
        });
    }
    createTicks(true); // X-axis
    createTicks(false); // Y-axis
}
export function normalizeCoordinate(coordinate) {
    //return Math.round(coordinate / COORDINATE_STEP) * COORDINATE_STEP;
    return coordinate;
}
export function coordinateToPixel(coordinate) {
    var exactPixel = PLANE_SIZE / 2 + (coordinate * PIXELS_PER_UNIT);
    // Force sub-pixel precision
    return Number(exactPixel.toFixed(1));
}
export function pixelToCoordinate(pixel) {
    return Math.round((pixel - PLANE_SIZE / 2) / PIXELS_PER_UNIT * 100) / 100;
    //return (pixel - PLANE_SIZE/2) / PIXELS_PER_UNIT;
}
export function formatCoordinateDisplay(x, y) {
    // Round to nearest 0.1 for display only
    var displayX = Math.round(x * 10) / 10;
    var displayY = Math.round(y * 10) / 10;
    return "(".concat(displayX.toFixed(1), ", ").concat(displayY.toFixed(1), ")");
    //return `(${Number(x).toFixed(2)}, ${Number(y).toFixed(2)})`;
}
export function getPixelDeltaForCoordinate(coordinateStep) {
    // Remove rounding to maintain precise movement
    return coordinateStep * PIXELS_PER_UNIT;
}
