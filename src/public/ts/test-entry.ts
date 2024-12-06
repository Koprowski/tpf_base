import { createTickMarks, pixelToCoordinate, coordinateToPixel } from './createTickMarks';
import log from './util.log';

// Test function to verify conversions
function testConversion(x: number, y: number) {
    log(`Testing conversion for point (${x}, ${y})`);
    const pixelX = coordinateToPixel(x);
    const pixelY = coordinateToPixel(-y); // Note the Y inversion
    log(`  -> Pixels: (${pixelX}, ${pixelY})`);
    const backX = pixelToCoordinate(pixelX);
    const backY = -pixelToCoordinate(pixelY);
    log(`  -> Back to coordinates: (${backX}, ${backY})`);
    return {
        original: { x, y },
        pixels: { x: pixelX, y: pixelY },
        converted: { x: backX, y: backY }
    };
}

export {
    createTickMarks,
    pixelToCoordinate,
    coordinateToPixel,
    testConversion,
    log
};