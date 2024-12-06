import { 
  PLANE_SIZE, 
  GRID_UNITS,
  PIXELS_PER_UNIT,
  COORDINATE_STEP
} from './constants';
import log from "./util.log";

export function createTickMarks(xyPlane: HTMLElement) {
  log('createTickMarks');
  
  const TICK_COUNT = 11;
  const SEGMENT_SIZE = PLANE_SIZE / (TICK_COUNT - 1);

  // First, remove any existing x-label elements
  const existingLabels = Array.from(xyPlane.getElementsByClassName('x-label'));
  existingLabels.forEach(label => label.remove());

  function createTicks(isXAxis: boolean) {
      const positions = Array.from({ length: TICK_COUNT }, (_, i) => i * SEGMENT_SIZE);
      const existingTicks = Array.from(xyPlane.getElementsByClassName(isXAxis ? 'x-tick' : 'y-tick'));
      
      existingTicks.forEach(tick => tick.remove());

      positions.forEach((pos, index) => {
          const tick = document.createElement('div');
          const classes = [isXAxis ? 'x-tick' : 'y-tick'];
          if (index === 5) {
              classes.push('center-tick');
          }
          tick.className = classes.join(' ');
          
          if (isXAxis) {
              tick.style.left = `${pos}px`;
          } else {
              tick.style.top = `${pos}px`;
          }

          xyPlane.appendChild(tick);
      });
  }

  createTicks(true);  // X-axis
  createTicks(false); // Y-axis
}

export function normalizeCoordinate(coordinate: number): number {
  //return Math.round(coordinate / COORDINATE_STEP) * COORDINATE_STEP;
  return coordinate;
}

export function coordinateToPixel(coordinate: number): number {
  const exactPixel = PLANE_SIZE/2 + (coordinate * PIXELS_PER_UNIT);
  // Force sub-pixel precision
  return Number(exactPixel.toFixed(1));
}

export function pixelToCoordinate(pixel: number): number {
  return Math.round((pixel - PLANE_SIZE/2) / PIXELS_PER_UNIT * 100) / 100;
  //return (pixel - PLANE_SIZE/2) / PIXELS_PER_UNIT;
}

export function formatCoordinateDisplay(x: number, y: number): string {
  return `(${Number(x).toFixed(2)}, ${Number(y).toFixed(2)})`;
}

export function getPixelDeltaForCoordinate(coordinateStep: number): number {
  // Remove rounding to maintain precise movement
  return coordinateStep * PIXELS_PER_UNIT;
}

