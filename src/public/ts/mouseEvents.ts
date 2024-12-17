import { tpf } from "./data";
import { COORDINATE_STEP, LABEL_CONNECTION } from './constants';
import { coordinateToPixel, pixelToCoordinate, normalizeCoordinate } from './createTickMarks';
import { recordDotState, generateDotId, addToUndoHistory } from "./data";
import { dotsSave } from "./dotsSave";
import log from "./util.log";
import { adjustHoverBox, adjustSelectedBox } from './dotsCreate';
import { updateConnectingLine } from './utils';
import { throttle, debounce } from './keyboardUtils';

export function getAbsolutePosition(coordinate: number, isX: boolean = true): number {
    return coordinateToPixel(isX ? coordinate : -coordinate);
}

async function autosaveToServer(dots: any[]) {
    try {
        // Check if we're on the homepage/new page
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length <= 2 || urlParts[1] === '') {
            // Don't attempt to autosave if we're on homepage/new page
            return;
        }

        const urlId = urlParts[urlParts.length - 1];

        // Convert dot positions to numbers before sending to server
        const processedDots = dots.map(dot => ({
            x: parseFloat(dot.x), // Remove 'px' and convert to number
            y: parseFloat(dot.y), // Remove 'px' and convert to number
            coordinates: dot.coordinates,
            label: dot.label
        }));

        const response = await fetch(`/api/pages/${urlId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dots: processedDots
            }),
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Failed to auto-save page');
        }

        log('Page auto-saved successfully');
    } catch (error) {
        // Only log error if not on homepage
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] !== '') {
            console.error('Error auto-saving page:', error);
        }
    }
}

function getAllDots() {
    return Array.from(document.getElementsByClassName('dot-container')).map(dotEl => {
        const labelElement = dotEl.querySelector('.user-dot-label');
        const coordsElement = dotEl.querySelector('.dot-coordinates');
        const dotElement = dotEl as HTMLElement;
        
        return {
            x: dotElement.style.left || '0px',
            y: dotElement.style.top || '0px',
            coordinates: coordsElement?.textContent || '',
            label: labelElement?.textContent || ''
        };
    });
}

document.addEventListener('keydown', (event) => {
    console.log('handleKeyboardMovement triggered');
    handleKeyboardMovement(event);
});

// Centralized state for dot positions
interface DotState {
    originalGridX: number;
    originalGridY: number;
    totalDeltaX: number;
    totalDeltaY: number;
    currentGridX: number;
    currentGridY: number;
}

const dotState: DotState = {
    originalGridX: 0,
    originalGridY: 0,
    totalDeltaX: 0,
    totalDeltaY: 0,
    currentGridX: 0,
    currentGridY: 0,
};

// Create debounced log function
const debouncedLog = debounce((message: string) => {
    log(message, 'keyboard');
}, 100);

// Create throttled movement function for keyboard
const throttledMove = throttle((event: KeyboardEvent) => {
    if (!tpf.selectedDot) return;
    
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;
    
    // Get current position using parseFloat instead of parseInt to preserve decimals
    const currentLeft = parseFloat(tpf.selectedDot.style.left) || 0;
    const currentTop = parseFloat(tpf.selectedDot.style.top) || 0;
    
    // Convert current pixel position to grid coordinates
    let currentGridX = pixelToCoordinate(currentLeft);
    let currentGridY = -pixelToCoordinate(currentTop);
    
    // Determine increment based on key combination
    let increment;
    if (event.ctrlKey && event.shiftKey) {
        increment = 0.01;
    } else if (event.ctrlKey) {
        increment = 0.5;
    } else {
        increment = COORDINATE_STEP; 
    }
    
    // Apply movement in grid coordinates
    switch (event.key) {
        case 'ArrowLeft':
            currentGridX -= increment;
            break;
        case 'ArrowRight':
            currentGridX += increment;
            break;
        case 'ArrowUp':
            currentGridY += increment;
            break;
        case 'ArrowDown':
            currentGridY -= increment;
            break;
    }
    
    // Ensure coordinates stay within bounds (-5 to 5)
    currentGridX = Math.max(-5, Math.min(5, currentGridX));
    currentGridY = Math.max(-5, Math.min(5, currentGridY));
    
    // Convert back to pixels
    const newLeft = coordinateToPixel(currentGridX);
    const newTop = coordinateToPixel(-currentGridY);
    
    // Update position
    tpf.selectedDot.style.left = `${newLeft}px`;
    tpf.selectedDot.style.top = `${newTop}px`;
    
    // Update coordinates text with precise formatting
    const coordsElement = tpf.selectedDot.querySelector('.dot-coordinates');
    if (coordsElement) {
        coordsElement.textContent = `(${currentGridX.toFixed(1)}, ${currentGridY.toFixed(1)})`; //change here
    }
    
    // Update connecting line and hover box
    updateConnectingLine(tpf.selectedDot);
    if (tpf.selectedDot.classList.contains('selected')) {
        adjustHoverBox(tpf.selectedDot);
    }
    
    // Log movement
    debouncedLog('handleKeyboardMovement triggered');
}, 16);

// Create throttled mouse move function for dragging
const throttledMouseMove = throttle((event: MouseEvent) => {
    // Skip if we're not actually dragging
    if (!tpf.isDragging || !tpf.currentDot || tpf.currentDot.classList.contains('editing')) return;
    
    event.preventDefault();
    
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;
    
    const rect = xyPlane.getBoundingClientRect();
    const newLeft = event.clientX - rect.left;
    const newTop = event.clientY - rect.top;
    
    if (isWithinBounds(newLeft, newTop, rect)) {
        const x = pixelToCoordinate(newLeft);
        const y = -pixelToCoordinate(newTop);
        
        const normalizedX = normalizeCoordinate(x);
        const normalizedY = normalizeCoordinate(y);
        
        const finalLeft = coordinateToPixel(normalizedX);
        const finalTop = coordinateToPixel(-normalizedY);
        
        // Update position
        tpf.currentDot.style.left = `${finalLeft}px`;
        tpf.currentDot.style.top = `${finalTop}px`;
        tpf.currentDot.style.transform = 'translate(-50%, -50%)';
        
        // Update coordinates text
        const coordsElement = tpf.currentDot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`;
        }

        // Update line position
        updateConnectingLine(tpf.currentDot);
        
        // Update hover box if needed
        if (tpf.currentDot.classList.contains('selected')) {
            adjustHoverBox(tpf.currentDot);
        }
    }
}, 16);

// Main keyboard handler
function handleKeyboardMovement(event: KeyboardEvent): void {
    const isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);
    
    if (!isArrowKey || !tpf.selectedDot) {
        return;
    }

    event.preventDefault();
    throttledMove(event);
}

function mouseDown(event: MouseEvent) {
    log('mouseDown');
    const target = event.target as HTMLElement;
    const dotContainer = findDotContainer(target);
    
    if (dotContainer && !dotContainer.classList.contains('editing') && !document.querySelector('.label-input:focus')) {
        event.preventDefault();
        tpf.isDragging = true;
        tpf.currentDot = dotContainer as HTMLDivElement;
        
        const rect = dotContainer.getBoundingClientRect();
        tpf.offsetX = event.clientX - rect.left;
        tpf.offsetY = event.clientY - rect.top;
    } else if (target.classList.contains('label-input')) {
        const dotContainers = document.querySelectorAll('.dot-container.selected');
        dotContainers.forEach((container) => container.classList.remove('selected'));
    }
}

function handleLabelBoxDrag(event: MouseEvent) {
    if (!tpf.currentLabelBox) return;
    
    const dotContainer = findDotContainer(tpf.currentLabelBox);
    if (!dotContainer) return;
    
    const dotRect = dotContainer.getBoundingClientRect();
    const newX = event.clientX - dotRect.left - tpf.labelBoxOffset.x;
    const newY = event.clientY - dotRect.top - tpf.labelBoxOffset.y;
    
    const dx = newX;
    const dy = newY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance >= LABEL_CONNECTION.MIN_LINE_LENGTH && 
        distance <= LABEL_CONNECTION.MAX_LINE_LENGTH) {
        
        tpf.currentLabelBox.style.left = `${newX}px`;
        tpf.currentLabelBox.style.top = `${newY}px`;
        
        updateConnectingLine(dotContainer);
        dotContainer.setAttribute('data-line-length', distance.toString());
    }
}

function mouseMove(event: MouseEvent) {
    // Handle label box dragging separately and without throttling
    if (tpf.isLabelBoxDragging && tpf.currentLabelBox) {
        handleLabelBoxDrag(event);
        return;
    }
    
    throttledMouseMove(event);
}

function mouseUp(event: MouseEvent) {
    log('mouseUp');
    if (tpf.isDragging && tpf.currentDot) {
        tpf.isDragging = false;
        
        const previousState = recordDotState(tpf.currentDot);
        
        // Ensure the dot has a unique ID
        if (!tpf.currentDot.getAttribute('data-dot-id')) {
            tpf.currentDot.setAttribute('data-dot-id', generateDotId());
        }
        
        // Add to undo history
        addToUndoHistory({
            type: 'move',
            dotId: tpf.currentDot.getAttribute('data-dot-id')!,
            previousState,
            newState: recordDotState(tpf.currentDot)
        });
        
        // Get all current dots and save only after drag is complete
        const dots = getAllDots();
        dotsSave(dots).catch(error => {
            console.error('Error saving dots:', error);
        });
        
        // Dispatch change event
        const moveEvent = new CustomEvent('dotChanged', { bubbles: true });
        tpf.currentDot.dispatchEvent(moveEvent);
        
        tpf.currentDot = null;
        tpf.skipGraphClick = true;
        
        setTimeout(() => {
            tpf.skipGraphClick = false;
        }, 0);
    }
}


function findDotContainer(element: HTMLElement | null): HTMLDivElement | null {
    if (!element) return null;
    if (element.classList.contains('dot-container')) {
        return element as HTMLDivElement;
    }
    if (element.parentElement) {
        return findDotContainer(element.parentElement);
    }
    return null;
}

function isWithinBounds(x: number, y: number, rect: DOMRect): boolean {
    return x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
}

export function updateDotCoordinates(dot: HTMLElement) {  
    const coordsElement = dot.querySelector('.dot-coordinates');
    if (!coordsElement) return;

    // Use the stored coordinate values instead of recalculating
    const storedCoords = dot.getAttribute('data-original-coords');
    if (storedCoords) {
        coordsElement.textContent = storedCoords;
    }
}

function autosaveDots() {
    const dots = getAllDots();
    autosaveToServer(dots);
}

export function startLabelBoxDrag(dot: HTMLElement, labelBox: HTMLElement, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    tpf.isLabelBoxDragging = true;
    tpf.currentLabelBox = labelBox as HTMLDivElement;
    
    const rect = labelBox.getBoundingClientRect();
    tpf.labelBoxOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    
    // Store original state for undo
    const previousState = recordDotState(dot);
    
    // Update mouseMove to handle label box dragging
    const originalMouseMove = window.onmousemove;
    const originalMouseUp = window.onmouseup;
    
    window.onmousemove = (e: MouseEvent) => {
        if (!tpf.isLabelBoxDragging || !tpf.currentLabelBox) return;
        
        const dotRect = dot.getBoundingClientRect();
        const newX = e.clientX - dotRect.left - tpf.labelBoxOffset.x;
        const newY = e.clientY - dotRect.top - tpf.labelBoxOffset.y;
        
        // Calculate distance from dot center
        const dx = newX;
        const dy = newY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Enforce minimum and maximum line length
        if (distance >= LABEL_CONNECTION.MIN_LINE_LENGTH && 
            distance <= LABEL_CONNECTION.MAX_LINE_LENGTH) {
            
            tpf.currentLabelBox.style.left = `${newX}px`;
            tpf.currentLabelBox.style.top = `${newY}px`;
            
            // Update connecting line
            updateConnectingLine(dot);
            
            // Store the new line length
            dot.setAttribute('data-line-length', distance.toString());
        }
    };
    
    window.onmouseup = () => {
        if (tpf.isLabelBoxDragging && tpf.currentLabelBox) {
            // Add to undo history
            addToUndoHistory({
                type: 'labelMove',
                dotId: dot.getAttribute('data-dot-id')!,
                previousState,
                newState: recordDotState(dot)
            });
            
            // Save the new state
            const dots = getAllDots();
            dotsSave(dots).catch(console.error);
        }
        
        // Reset dragging state
        tpf.isLabelBoxDragging = false;
        tpf.currentLabelBox = null;
        window.onmousemove = originalMouseMove;
        window.onmouseup = originalMouseUp;
    };
}


export { 
    tpf,
    mouseMove,
    mouseUp,
    mouseDown,
    adjustHoverBox,
    autosaveDots,
    debounce,
    throttle,
    handleKeyboardMovement
};