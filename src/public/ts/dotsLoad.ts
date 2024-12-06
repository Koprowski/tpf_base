import { mouseDown, mouseUp, mouseMove } from './mouseEvents';
//import { coordinateToPixel, pixelToCoordinate } from './createTickMarks';
import { tpf } from './data';
import log from "./util.log";
import { DOT_BOX, LABEL_CONNECTION } from './constants';
import { generateDotId } from './data';
import { updateConnectingLine, startLabelBoxDrag } from './utils';
import { SavedDot } from './types';
import { createLabelEditor } from './dotsCreate';
import { DEBUG } from './constants';
import { debounce } from './keyboardUtils';

function loadSavedDots(savedDot: SavedDot): HTMLDivElement {
    const dot = document.createElement('div') as HTMLDivElement;
    dot.classList.add('dot-container');
    dot.setAttribute('data-dot-id', savedDot.id || generateDotId());
       
    dot.style.position = 'absolute';
    dot.style.left = savedDot.x;
    dot.style.top = savedDot.y;
    dot.setAttribute('data-original-position', JSON.stringify({
        x: savedDot.x,
        y: savedDot.y
    }));

    try {
        if (!savedDot.coordinates) {
            throw new Error('Missing coordinates string');
        }

        const coordMatch = savedDot.coordinates.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
        if (!coordMatch) {
            throw new Error('Invalid coordinates format');
        }

        const gridX = parseFloat(coordMatch[1]);
        const gridY = parseFloat(coordMatch[2]);

        if (isNaN(gridX) || isNaN(gridY)) {
            throw new Error('Invalid coordinate values');
        }

        // Create dot element with proper positioning
        const dotElement = document.createElement('div');
        dotElement.className = 'dot';
        dotElement.style.position = 'absolute';
        dotElement.style.top = 'calc(50% - 1px)'; // Negative makes it go down
        dotElement.style.left = 'calc(50% - 2px)'; // Negative adj makes it go right
        dotElement.setAttribute('data-position-set', 'true');
        dot.appendChild(dotElement);

        // Get dot dimensions for centering
        const dotRect = dotElement.getBoundingClientRect();
        const dotRadius = dotRect.width / 2;

        // Use saved label position or default
        const labelPosition = savedDot.labelOffset || {
            x: LABEL_CONNECTION.DEFAULT_LENGTH,
            y: -LABEL_CONNECTION.DEFAULT_LENGTH
        };

        // Create connecting line with precise measurements
        const line = document.createElement('div');
        line.className = 'connecting-line';
        const lineLength = savedDot.lineLength || 
                         Math.sqrt(labelPosition.x * labelPosition.x + labelPosition.y * labelPosition.y);
                
        Object.assign(line.style, {
            position: 'absolute',
            width: `${lineLength}px`,
            height: '1px',
            transformOrigin: `${dotRadius}px center`,
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: `${LABEL_CONNECTION.LINE_WIDTH}px solid ${LABEL_CONNECTION.LINE_COLOR}`,
            pointerEvents: 'none',
            display: 'block',
            visibility: 'visible',
            zIndex: '1'
        });
        
        // Validate line styles
        if (!line.style.width || !line.style.transformOrigin) {
            console.error('Failed to apply line styles');
            throw new Error('Line style application failed');
        }
        
        dot.setAttribute('data-line-length', lineLength.toString());
        
        // Calculate and apply line angle
        const lineAngle = savedDot.lineAngle ?? 
                         Math.atan2(labelPosition.y, labelPosition.x) * (180 / Math.PI);
        line.style.transform = `rotate(${lineAngle}deg)`;
        dot.setAttribute('data-line-angle', lineAngle.toString());
        
        dot.appendChild(line);

        // Create label container with precise positioning
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-container';
        Object.assign(labelContainer.style, {
            position: 'absolute',
            left: `${labelPosition.x}px`,
            top: `${labelPosition.y}px`,
            backgroundColor: LABEL_CONNECTION.BOX_BACKGROUND,
            border: `${LABEL_CONNECTION.BOX_BORDER_WIDTH}px solid ${LABEL_CONNECTION.BOX_BORDER_COLOR}`,
            borderRadius: `${LABEL_CONNECTION.BOX_BORDER_RADIUS}px`,
            padding: '8px',
            cursor: 'move',
            whiteSpace: 'nowrap',
            zIndex: '2'
        });

        labelContainer.innerHTML = `
            <div class='user-dot-label'>${savedDot.label || ''}</div>
            <div class='dot-coordinates'>${savedDot.coordinates}</div>
        `;

        // Verify label elements
        if (!labelContainer.querySelector('.user-dot-label') || 
            !labelContainer.querySelector('.dot-coordinates')) {
            throw new Error('Failed to create label elements');
        }

        dot.appendChild(labelContainer);

        // Add drag event listener
        labelContainer.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            // Instead of startLabelBoxDrag, we want to trigger label editing
            const labelElement = labelContainer.querySelector('.user-dot-label') as HTMLElement;
            if (labelElement) {
                createLabelEditor(labelElement, dot);
            }
        });

        // Store complete position data
        dot.setAttribute('data-position', JSON.stringify({
            x: gridX,
            y: gridY,
            labelOffset: labelPosition,
            lineLength: lineLength,
            lineAngle: lineAngle
        }));

        // Store original offset for debugging and state management
        dot.setAttribute('data-original-offset', JSON.stringify(labelPosition));

        // Verify layout and measurements
        Promise.resolve().then(() => {
            const lineRect = line.getBoundingClientRect();
            const labelRect = labelContainer.getBoundingClientRect();
            
            if (lineRect.width === 0 || labelRect.width === 0) {
                console.warn('Zero-width elements detected, updating layout');
                updateConnectingLine(dot);
            }
        });

        // Initial line update
        requestAnimationFrame(() => updateConnectingLine(dot));

        const labelBounds = labelContainer.getBoundingClientRect();
        const dotBounds = dot.getBoundingClientRect();
        
    } catch (error) {
        console.error('Error creating dot:', error);
        console.error('Creation error details:', {
            savedDot,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        // Fallback creation with minimum required elements
        dot.innerHTML = `
            <div class='dot'></div>
            <div class='connecting-line'></div>
            <div class='label-container'>
                <div class='user-dot-label'>${savedDot.label || ''}</div>
                <div class='dot-coordinates'>(0.00, 0.00)</div>
            </div>
        `;
    }
        // Add core event listeners
        dot.addEventListener('mousedown', mouseDown);
        dot.addEventListener('mouseup', mouseUp);
        dot.addEventListener('mouseover', () => {
            if (!dot.classList.contains('editing')) {
                adjustHoverBox(dot);
            }
        });
        
        return dot;
       
}

const debouncedAdjustHover = debounce((dotContainer: HTMLElement) => {
    if (
        dotContainer.hasAttribute('data-hover-width') && 
        dotContainer.hasAttribute('data-hover-height') && 
        !dotContainer.classList.contains('editing')
    ) {
        const storedWidth = dotContainer.getAttribute('data-hover-width');
        const storedHeight = dotContainer.getAttribute('data-hover-height');
        
        if (DEBUG) {
            console.log('Using cached hover dimensions:', {
                width: storedWidth,
                height: storedHeight,
                dotId: dotContainer.getAttribute('data-dot-id')
            });
        }
        
        dotContainer.style.setProperty('--hover-width', storedWidth);
        dotContainer.style.setProperty('--hover-height', storedHeight);
        dotContainer.style.setProperty('--hover-top', '-23px');
        dotContainer.style.setProperty('--hover-left', '-5px');
        return;
    }
    
    const labelElement = dotContainer.querySelector('.user-dot-label') as HTMLElement;
    const coordsElement = dotContainer.querySelector('.dot-coordinates') as HTMLElement;
    
    if (!labelElement || !coordsElement) return;
    
    const labelRect = labelElement.getBoundingClientRect();
    const coordsRect = coordsElement.getBoundingClientRect();
    
    const totalWidth = `${Math.max(DOT_BOX.MIN_WIDTH, Math.max(labelRect.width, coordsRect.width) + DOT_BOX.LEFT_PADDING)}px`;
    const totalHeight = `${Math.max(DOT_BOX.MIN_HEIGHT, coordsRect.bottom - labelRect.top + 10)}px`;
    
    if (DEBUG) {
        console.log('Calculating new hover dimensions:', {
            width: totalWidth,
            height: totalHeight,
            dotId: dotContainer.getAttribute('data-dot-id')
        });
    }
    
    dotContainer.setAttribute('data-hover-width', totalWidth);
    dotContainer.setAttribute('data-hover-height', totalHeight);
    
    dotContainer.style.setProperty('--hover-width', totalWidth);
    dotContainer.style.setProperty('--hover-height', totalHeight);
    dotContainer.style.setProperty('--hover-top', `${DOT_BOX.TOP_OFFSET}px`);
    dotContainer.style.setProperty('--hover-left', `-${DOT_BOX.DOT_WIDTH/2+2}px`);
}, 100); // 100ms debounce

function adjustHoverBox(dotContainer: HTMLElement) {
    debouncedAdjustHover(dotContainer);
}

function initializeDotFromSaved(savedDot: SavedDot): HTMLDivElement {
    console.log('Initializing dot from saved data:', savedDot);
    return loadSavedDots(savedDot);
}

function waitForXYPlane(): Promise<void> {
    return new Promise((resolve) => {
        const checkXYPlane = () => {
            const xyPlane = document.getElementById("xy-plane");
            if (xyPlane && xyPlane.getBoundingClientRect().width > 0) {
                resolve();
            } else {
                setTimeout(checkXYPlane, 50);
            }
        };
        checkXYPlane();
    });
}

function handleContextMenu(event: Event) {
    log('dot.contextmenu');
    event.preventDefault();
    tpf.currentDot = null;
}

function findDotContainer(element: HTMLElement): HTMLElement | null {
    if (element.classList.contains('dot-container')) {
        return element;
    }
    if (element.parentElement) {
        return findDotContainer(element.parentElement);
    }
    return null;
}

async function dotsLoad() {
    const MAX_RETRIES = 3;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
        try {
            const urlParts = window.location.pathname.split('/');
            if (urlParts.length <= 2 || urlParts[1] === '') {
                log('Homepage detected - skipping load', 'dots');
                return;
            }

            const urlId = urlParts[urlParts.length - 1];
            console.log('Loading dots for URL ID:', urlId);

            const response = await fetch(`/api/pages/${urlId}/dots`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`Failed to load dots: ${response.status}`);
            }

            const data = await response.json();
            
            const dots = Array.isArray(data) ? data : (data.dots || []);
            console.log('Processed dots array from server:', JSON.stringify(dots, null, 2));

            const xyPlane = document.getElementById('xy-plane');
            if (!xyPlane) {
                throw new Error('XY Plane not found');
            }

            const existingDots = xyPlane.getElementsByClassName('dot-container');
            Array.from(existingDots).forEach(dot => dot.remove());

            dots.forEach((dot: SavedDot) => {
                
                try {
                    // Process incoming dot data
                    const processedDot = {
                        ...dot,
                        x: dot.x.includes('px') ? dot.x : `${dot.x}px`,
                        y: dot.y.includes('px') ? dot.y : `${dot.y}px`,
                        coordinates: dot.coordinates,
                        label: dot.label,
                        labelOffset: dot.labelOffset || { x: 50, y: -50 },
                        lineLength: dot.lineLength || 70.71067811865476
                    };

                    const dotElement = initializeDotFromSaved(processedDot);
                    xyPlane.appendChild(dotElement);
                    
                    // Verify dot creation
                    const labelContainer = dotElement.querySelector('.label-container') as HTMLElement;
                    
                    // Validate created elements
                    const validation = {
                        hasLabel: !!dotElement.querySelector('.user-dot-label'),
                        hasCoords: !!dotElement.querySelector('.dot-coordinates'),
                        hasLine: !!dotElement.querySelector('.connecting-line')
                    };

                    if (!validation.hasLabel || !validation.hasCoords || !validation.hasLine) {
                        console.warn('Dot missing required elements:', validation);
                    }

                    // Check position values
                    const position = {
                        left: dotElement.style.left,
                        top: dotElement.style.top
                    };

                    if (!position.left || !position.top) {
                        console.warn('Invalid dot position:', position);
                    }

                } catch (error) {
                    console.error('Error creating individual dot:', error);
                    console.error('Failed dot data:', dot);
                    if (error instanceof Error) {
                        console.error('Creation error details:', {
                            message: error.message,
                            stack: error.stack
                        });
                    }
                }
            });

            return;

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount === MAX_RETRIES) {
                console.error('Failed to load dots after maximum retries');
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
    }
}

export { 
    dotsLoad,
    adjustHoverBox,
    waitForXYPlane,
    handleContextMenu,
    findDotContainer,
    loadSavedDots
};