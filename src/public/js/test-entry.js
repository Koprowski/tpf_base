import { createTickMarks, pixelToCoordinate, coordinateToPixel } from './createTickMarks';
import log from './util.log';
// Test function to verify conversions
function testConversion(x, y) {
    log("Testing conversion for point (".concat(x, ", ").concat(y, ")"));
    var pixelX = coordinateToPixel(x);
    var pixelY = coordinateToPixel(-y); // Note the Y inversion
    log("  -> Pixels: (".concat(pixelX, ", ").concat(pixelY, ")"));
    var backX = pixelToCoordinate(pixelX);
    var backY = -pixelToCoordinate(pixelY);
    log("  -> Back to coordinates: (".concat(backX, ", ").concat(backY, ")"));
    return {
        original: { x: x, y: y },
        pixels: { x: pixelX, y: pixelY },
        converted: { x: backX, y: backY }
    };
}
export { createTickMarks, pixelToCoordinate, coordinateToPixel, testConversion, log };
