import { tpf } from "./data";
import { COORDINATE_STEP, LABEL_CONNECTION } from './constants';
import { coordinateToPixel, pixelToCoordinate, normalizeCoordinate } from './createTickMarks';
import { recordDotState, generateDotId, addToUndoHistory } from "./data";
import { dotsSave } from "./dotsSave";
import log from "./util.log";
import { adjustHoverBox, adjustSelectedBox } from './dotsCreate';
import { updateConnectingLine } from './utils';
import { throttle, debounce } from './keyboardUtils';

function ensureHTMLElement(element: Element): HTMLElement {
    if (element instanceof HTMLElement) {
        return element;
    }
    // Fallback: create a new HTMLElement if conversion fails
    const htmlElement = document.createElement('div');
    htmlElement.innerHTML = element.innerHTML;
    return htmlElement;
}

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
    
    // Handle Escape key
    if (event.key === 'Escape') {
        const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        selectedDots.forEach((dot) => {
            dot.classList.remove('selected');
            dot.classList.remove('multi-selected');
            adjustHoverBox(dot as HTMLElement);
            adjustSelectedBox(dot as HTMLElement);
        });
        tpf.selectedDot = null;
        return;
    }
    
    // Handle movement keys
    handleKeyboardMovement(event);
    // Handle delete key
    handleKeyboardDelete(event);
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
    // Get all currently selected dots
    const selectedDots = document.querySelectorAll('.dot-container.selected');
    
    if (selectedDots.length === 0) return;
    
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;
    
    // Determine increment based on key combination
    let increment;
    if (event.ctrlKey && event.shiftKey) {
        increment = 0.01;
    } else if (event.ctrlKey) {
        increment = 0.5;
    } else {
        increment = COORDINATE_STEP; 
    }
    
    // Move all selected dots
    selectedDots.forEach((selectedDot) => {
        const dot = selectedDot as HTMLDivElement;
        
        // Get current position using parseFloat instead of parseInt to preserve decimals
        const currentLeft = parseFloat(dot.style.left) || 0;
        const currentTop = parseFloat(dot.style.top) || 0;
        
        // Convert current pixel position to grid coordinates
        let currentGridX = pixelToCoordinate(currentLeft);
        let currentGridY = -pixelToCoordinate(currentTop);
        
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
        dot.style.left = `${newLeft}px`;
        dot.style.top = `${newTop}px`;
        
        // Update coordinates text with precise formatting
        const coordsElement = dot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${currentGridX.toFixed(1)}, ${currentGridY.toFixed(1)})`;
        }
        
        // Update connecting line and hover box
        updateConnectingLine(dot);
        if (dot.classList.contains('selected')) {
            adjustHoverBox(dot);
        }
    });
    
    // Log movement
    debouncedLog('handleKeyboardMovement triggered');
}, 16);

// Create throttled mouse move function for dragging
const throttledMouseMove = throttle((event: MouseEvent) => {
    // Skip if we're not actually dragging
    if (!tpf.isDragging || tpf.currentDot?.classList.contains('editing')) return;
    
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;
    
    const rect = xyPlane.getBoundingClientRect();
    const newLeft = event.clientX - rect.left;
    const newTop = event.clientY - rect.top;
    
    // Check for multi-dot selection
    const multiSelectedDots = document.querySelectorAll('.dot-container.multi-selected');
    
    // Function to move a single dot and update its properties
    const moveDot = (dot: HTMLElement, deltaX: number, deltaY: number) => {
        // Get current position with explicit fallback
        const currentLeft = parseFloat(dot.style.left || '0');
        const currentTop = parseFloat(dot.style.top || '0');
        
        // Calculate new position
        const finalLeft = currentLeft + deltaX;
        const finalTop = currentTop + deltaY;
        
        // Convert to grid coordinates
        const x = pixelToCoordinate(finalLeft);
        const y = -pixelToCoordinate(finalTop);
        
        // Normalize coordinates
        const normalizedX = Math.max(-5, Math.min(5, x));
        const normalizedY = Math.max(-5, Math.min(5, y));
        
        // Convert back to pixels
        const finalPixelLeft = coordinateToPixel(normalizedX);
        const finalPixelTop = coordinateToPixel(-normalizedY);
        
        // Update dot position
        dot.style.left = `${finalPixelLeft}px`;
        dot.style.top = `${finalPixelTop}px`;
        
        // Update coordinates text
        const coordsElement = dot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`;
        }
        
        // Update connecting line
        updateConnectingLine(dot);
        
        // Adjust hover box if needed
        if (dot.classList.contains('selected')) {
            // Type assertion to handle hover box function
            (adjustHoverBox as (dot: HTMLElement) => void)(dot);
        }
    };
    
    // If multiple dots are selected, move them together
    if (multiSelectedDots.length > 0) {
        // Safe parsing with explicit fallback
        const currentDotLeft = tpf.currentDot?.style.left || '0';
        const currentDotTop = tpf.currentDot?.style.top || '0';
        
        // Calculate movement delta
        const deltaX = newLeft - parseFloat(currentDotLeft);
        const deltaY = newTop - parseFloat(currentDotTop);
        
        multiSelectedDots.forEach(dot => {
            moveDot(dot as HTMLElement, deltaX, deltaY);
        });
    } 
    // Otherwise, move the single current dot
    else if (tpf.currentDot && isWithinBounds(newLeft, newTop, rect)) {
        const x = pixelToCoordinate(newLeft);
        const y = -pixelToCoordinate(newTop);
        
        const normalizedX = normalizeCoordinate(x);
        const normalizedY = normalizeCoordinate(y);
        
        const finalLeft = coordinateToPixel(normalizedX);
        const finalTop = coordinateToPixel(-normalizedY);
        
        // Update position
        tpf.currentDot.style.left = `${finalLeft}px`;
        tpf.currentDot.style.top = `${finalTop}px`;
        
        // Update coordinates text
        const coordsElement = tpf.currentDot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`;
        }

        // Update line position
        updateConnectingLine(tpf.currentDot);
        
        // Update hover box if needed
        if (tpf.currentDot.classList.contains('selected')) {
            // Type assertion to handle hover box function
            (adjustHoverBox as (dot: HTMLElement) => void)(tpf.currentDot);
        }
    }
}, 16); // 16ms is roughly 60 FPS

// Main keyboard handler
function handleKeyboardMovement(event: KeyboardEvent): void {
    const isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);
    
    // Get all selected dots, including both single and multi-selected
    const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
    
    if (!isArrowKey || selectedDots.length === 0) {
        return;
    }

    event.preventDefault();
    
    // Determine increment based on key combination
    let increment;
    if (event.ctrlKey && event.shiftKey) {
        increment = 0.01;
    } else if (event.ctrlKey) {
        increment = 0.5;
    } else {
        increment = COORDINATE_STEP;
    }

    // Move all selected dots
    selectedDots.forEach((selectedDot) => {
        const dot = selectedDot as HTMLDivElement;
        
        // Get current position using parseFloat to preserve decimals
        const currentLeft = parseFloat(dot.style.left) || 0;
        const currentTop = parseFloat(dot.style.top) || 0;
        
        // Convert current pixel position to grid coordinates
        let currentGridX = pixelToCoordinate(currentLeft);
        let currentGridY = -pixelToCoordinate(currentTop);
        
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
        dot.style.left = `${newLeft}px`;
        dot.style.top = `${newTop}px`;
        
        // Update coordinates text with precise formatting
        const coordsElement = dot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${currentGridX.toFixed(1)}, ${currentGridY.toFixed(1)})`;
        }
        
        // Update connecting line and hover box
        updateConnectingLine(dot);
        if (dot.classList.contains('selected')) {
            adjustHoverBox(dot);
        }
    });
    
    // Log movement
    debouncedLog('handleKeyboardMovement triggered');

    // Trigger autosave after movement
    const urlParts = window.location.pathname.split('/');
    if (urlParts.length > 2 && urlParts[1] !== '') {
        autosaveDots();
    }
}

function handleKeyboardDelete(event: KeyboardEvent) {
    // Only handle delete key
    if (event.key !== 'Delete') return;
    
    // Get all multi-selected dots
    const dotsToDelete = document.querySelectorAll('.dot-container.multi-selected, .dot-container.selected');
    
    if (dotsToDelete.length === 0) return;

    // Process all selected dots
    dotsToDelete.forEach(dotElement => {
        const dotId = dotElement.getAttribute('data-dot-id');
        if (dotId) {
            const previousState = recordDotState(dotElement as HTMLElement);
            dotElement.remove();
            addToUndoHistory({
                type: 'delete',
                dotId: dotId,
                previousState,
                newState: undefined
            });
        }
    });

    // Clear selection tracking
    tpf.selectedDot = null;

    // Trigger autosave if not on homepage
    const urlParts = window.location.pathname.split('/');
    if (urlParts.length > 2 && urlParts[1] !== '') {
        autosaveDots();
    }
}

function mouseDown(event: MouseEvent) {
    log('mouseDown');
    const target = event.target as HTMLElement;
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;

    console.log('MouseDown event:', {
        target: event.target,
        targetType: (event.target as HTMLElement).className,
        isXYPlane: event.target === xyPlane
    });
    
    console.log('Selection state:', {
        selectedCount: document.querySelectorAll('.dot-container.selected').length,
        multiSelectedCount: document.querySelectorAll('.dot-container.multi-selected').length,
        isShiftPressed: event.shiftKey,
        isDragging: tpf.isDragging,
        isSelecting,
        currentDot: tpf.currentDot?.getAttribute('data-dot-id') || null
    });

    // Get any currently selected dots
    const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
    const hasSelectedDots = selectedDots.length > 0;

    // If clicking on xy-plane and dots are selected, handle deselection first
    if (target === xyPlane && (hasSelectedDots || tpf.selectedDot)) {
        console.log('=== Deselecting dots ===');
        // Stop all event handling first
        event.stopImmediatePropagation(); // This prevents all other handlers from firing
        event.preventDefault();
        event.stopPropagation();
        
        // Deselect all dots
        selectedDots.forEach(dot => {
            dot.classList.remove('selected');
            dot.classList.remove('multi-selected');
            adjustHoverBox(dot as HTMLElement);
            adjustSelectedBox(dot as HTMLElement);
        });
        tpf.selectedDot = null;
        tpf.isDragging = false;
        tpf.currentDot = null;
        tpf.skipGraphClick = true;
        
        // Set a timeout to reset skipGraphClick
        setTimeout(() => {
            tpf.skipGraphClick = false;
        }, 0);

        return;
    }

    // Check if we clicked a dot or part of a dot container
    const dotContainer = findDotContainer(target);
    const isShiftKeyPressed = event.shiftKey;
    
    // Handle dot container clicks
    if (dotContainer && !dotContainer.classList.contains('editing') && !document.querySelector('.label-input:focus')) {
        event.preventDefault();
        event.stopPropagation();
        
        // If shift key is not pressed, handle single selection
        if (!isShiftKeyPressed) {
            // Clear other selections
            const previouslySelected = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
            previouslySelected.forEach(d => {
                if (d !== dotContainer) {
                    d.classList.remove('selected');
                    d.classList.remove('multi-selected');
                    adjustHoverBox(d as HTMLElement);
                    adjustSelectedBox(d as HTMLElement);
                }
            });
            
            // Toggle selection on clicked dot
            const isCurrentlySelected = dotContainer.classList.contains('selected') || 
                                     dotContainer.classList.contains('multi-selected');
                                     
            if (isCurrentlySelected) {
                dotContainer.classList.remove('selected');
                dotContainer.classList.remove('multi-selected');
                tpf.selectedDot = null;
            } else {
                dotContainer.classList.add('selected');
                dotContainer.classList.remove('multi-selected');
                tpf.selectedDot = dotContainer;
            }
        } else {
            // Shift key is pressed - handle multi-selection
            console.log('Multi-select triggered:', {
                existingSelections: document.querySelectorAll('.dot-container.multi-selected').length,
                shiftKey: event.shiftKey,
                targetIsDot: !!findDotContainer(event.target as HTMLElement)
            });
            
            const wasSelected = dotContainer.classList.contains('selected') || 
                             dotContainer.classList.contains('multi-selected');
            
            if (wasSelected) {
                dotContainer.classList.remove('selected');
                dotContainer.classList.remove('multi-selected');
            } else {
                dotContainer.classList.add('multi-selected');
                dotContainer.classList.remove('selected');
                tpf.selectedDot = dotContainer;
            }
            
            // Convert any single selections to multi-selections if we have multiple dots
            const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
            if (selectedDots.length > 1) {
                selectedDots.forEach(dot => {
                    dot.classList.remove('selected');
                    dot.classList.add('multi-selected');
                });
            }
        }
        
        adjustHoverBox(dotContainer);
        adjustSelectedBox(dotContainer);
        
        // Prepare for potential dragging
        tpf.isDragging = true;
        tpf.currentDot = dotContainer;
        
        const rect = dotContainer.getBoundingClientRect();
        tpf.offsetX = event.clientX - rect.left;
        tpf.offsetY = event.clientY - rect.top;
        return;
    }

    // Handle xy-plane clicks (including multi-select)
    if (target === xyPlane) {
        if (!isShiftKeyPressed) {
            // Clear selections on plain click
            const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
            selectedDots.forEach((container) => {
                container.classList.remove('selected');
                container.classList.remove('multi-selected');
                adjustHoverBox(container as HTMLElement);
                adjustSelectedBox(container as HTMLElement);
            });
            tpf.selectedDot = null;
        }
        
        // Only handle multi-select if no dots were previously selected
        if (!hasSelectedDots) {
            handleMultiDotSelection(event);
        }
    }
}

// Update findDotContainer to handle potential null cases more explicitly
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

    // Skip early if not doing anything
    if (!tpf.isDragging || tpf.currentDot?.classList.contains('editing')) {
        return;
    }

    // Only log when actually dragging dots
    if (tpf.isDragging && tpf.currentDot) {
        console.log('Moving dot(s):', {
            selectedDots: document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length,
            isDragging: true
        });
    }

    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;

    const rect = xyPlane.getBoundingClientRect();
    const newLeft = event.clientX - rect.left;
    const newTop = event.clientY - rect.top;

    // Get all selected dots
    const selectedDots = document.querySelectorAll('.dot-container.selected');

    // If we have multiple selected dots
    if (selectedDots.length > 1) {
        // Calculate movement delta based on current dot
        const currentLeft = parseFloat(tpf.currentDot?.style.left || '0');
        const currentTop = parseFloat(tpf.currentDot?.style.top || '0');
        const deltaX = newLeft - currentLeft;
        const deltaY = newTop - currentTop;

        // Move all selected dots by the same delta
        selectedDots.forEach(dot => {
            const dotEl = dot as HTMLElement;
            const originalLeft = parseFloat(dotEl.style.left || '0');
            const originalTop = parseFloat(dotEl.style.top || '0');
            
            const finalLeft = originalLeft + deltaX;
            const finalTop = originalTop + deltaY;

            // Convert to grid coordinates
            const x = pixelToCoordinate(finalLeft);
            const y = -pixelToCoordinate(finalTop);

            // Normalize coordinates
            const normalizedX = Math.max(-5, Math.min(5, x));
            const normalizedY = Math.max(-5, Math.min(5, y));

            // Convert back to pixels
            const finalPixelLeft = coordinateToPixel(normalizedX);
            const finalPixelTop = coordinateToPixel(-normalizedY);

            // Update position
            dotEl.style.left = `${finalPixelLeft}px`;
            dotEl.style.top = `${finalPixelTop}px`;

            // Update coordinates display
            const coordsElement = dotEl.querySelector('.dot-coordinates');
            if (coordsElement) {
                coordsElement.textContent = `(${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`;
            }

            updateConnectingLine(dotEl);

            if (dotEl.classList.contains('selected')) {
                adjustHoverBox(dotEl);
            }
        });
    } 
    // Single dot movement
    else if (tpf.currentDot && isWithinBounds(newLeft, newTop, rect)) {
        const x = pixelToCoordinate(newLeft);
        const y = -pixelToCoordinate(newTop);
        
        const normalizedX = normalizeCoordinate(x);
        const normalizedY = normalizeCoordinate(y);
        
        const finalLeft = coordinateToPixel(normalizedX);
        const finalTop = coordinateToPixel(-normalizedY);
        
        tpf.currentDot.style.left = `${finalLeft}px`;
        tpf.currentDot.style.top = `${finalTop}px`;
        
        const coordsElement = tpf.currentDot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `(${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`;
        }

        updateConnectingLine(tpf.currentDot);
        
        if (tpf.currentDot.classList.contains('selected')) {
            adjustHoverBox(tpf.currentDot);
        }
    }
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

// SELECT and MOVE MULTIPLE DOTS START//

let isSelecting = false;
let selectionStart: { x: number; y: number } | null = null;
let selectionRectangle: HTMLDivElement | null = null;

function createSelectionRectangle() {
    const rectangle = document.createElement('div');
    rectangle.classList.add('selection-rectangle');
    rectangle.style.position = 'absolute';
    rectangle.style.border = '1px solid blue';
    rectangle.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
    rectangle.style.pointerEvents = 'none';
    return rectangle;
}

function handleMultiDotSelection(event: MouseEvent) {
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;

    // Prevent default to stop dot creation
    event.preventDefault();
    event.stopPropagation();

    // Only start selection if clicking on empty graph space
    if (event.target !== xyPlane) return;

    // Clean up any existing selection rectangles first
    const existingRectangles = document.querySelectorAll('.selection-rectangle');
    existingRectangles.forEach(rect => rect.remove());

    // Clear previous selections if not using shift key
    if (!event.shiftKey) {
        const previouslySelected = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        previouslySelected.forEach(dot => {
            dot.classList.remove('selected');
            dot.classList.remove('multi-selected');
            adjustHoverBox(dot as HTMLElement);
            adjustSelectedBox(dot as HTMLElement);
        });
    }

    isSelecting = true;
    
    selectionStart = {
        x: event.clientX - xyPlane.getBoundingClientRect().left,
        y: event.clientY - xyPlane.getBoundingClientRect().top
    };

    // Create and add selection rectangle to the document body
    selectionRectangle = createSelectionRectangle();
    document.body.appendChild(selectionRectangle);

    const cleanup = () => {
        isSelecting = false;
        if (selectionRectangle) {
            selectionRectangle.remove();
            selectionRectangle = null;
        }
        selectionStart = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('keydown', onEscape);
    };

    const onEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            cleanup();
        }
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isSelecting || !selectionStart || !selectionRectangle || !xyPlane) return;

        // Calculate positions relative to page
        const xyPlaneRect = xyPlane.getBoundingClientRect();
        const currentX = moveEvent.clientX;
        const currentY = moveEvent.clientY;
        const startX = xyPlaneRect.left + selectionStart.x;
        const startY = xyPlaneRect.top + selectionStart.y;

        // Update rectangle dimensions
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        Object.assign(selectionRectangle.style, {
            position: 'fixed',
            width: `${width}px`,
            height: `${height}px`,
            left: `${left}px`,
            top: `${top}px`,
            display: 'block',
            zIndex: '1000'
        });

        // Update selected dots
        const dots = document.querySelectorAll('.dot-container');
        const selectedDots = new Set<Element>();

        dots.forEach(dot => {
            const dotRect = dot.getBoundingClientRect();
            const dotBox = {
                left: dotRect.left,
                right: dotRect.right,
                top: dotRect.top,
                bottom: dotRect.bottom
            };
            
            // Check if any part of the dot container intersects with selection
            if (!(left > dotBox.right || 
                left + width < dotBox.left || 
                top > dotBox.bottom || 
                top + height < dotBox.top)) {
                
                selectedDots.add(dot);
            }
        });

        // Apply appropriate selection states
        dots.forEach(dot => {
            if (selectedDots.has(dot)) {
                // Always use multi-selected for drag box selection
                dot.classList.remove('selected');
                dot.classList.add('multi-selected');
            } else if (!moveEvent.shiftKey) {
                // Clear selection for unselected dots
                dot.classList.remove('selected');
                dot.classList.remove('multi-selected');
            }
            adjustHoverBox(dot as HTMLElement);
            adjustSelectedBox(dot as HTMLElement);
        });
    };

    const onMouseUp = () => {
        if (!isSelecting) return;
        
        // Update selection states one final time
        const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        const dotsArray = Array.from(selectedDots);
        
        if (dotsArray.length > 0) {
            // Always keep dots in multi-selected state when using drag box
            dotsArray.forEach(dot => {
                dot.classList.remove('selected');
                dot.classList.add('multi-selected');
                adjustHoverBox(dot as HTMLElement);
                adjustSelectedBox(dot as HTMLElement);
            });
            
            // Update tpf.selectedDot
            tpf.selectedDot = dotsArray[dotsArray.length - 1] as HTMLDivElement;
        }

        cleanup();
    };

    // Add event listeners to window
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onEscape);
}

function highlightSelectedDots(left: number, top: number, width: number, height: number) {
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) return;

    const dotContainers = document.querySelectorAll('.dot-container');
    
    let selectedDotsCount = 0;

    dotContainers.forEach(dot => {
        try {
            // Convert to HTMLElement safely using our utility function
            const dotElement = ensureHTMLElement(dot);
            const dotRect = dotElement.getBoundingClientRect();
            const xyPlaneRect = xyPlane.getBoundingClientRect();

            const dotLeft = dotRect.left - xyPlaneRect.left;
            const dotTop = dotRect.top - xyPlaneRect.top;
            const dotRight = dotLeft + dotRect.width;
            const dotBottom = dotTop + dotRect.height;

            const isInSelection = 
                dotLeft >= left && 
                dotRight <= left + width && 
                dotTop >= top && 
                dotBottom <= top + height;

            // Only add selected class if not already selected
            if (isInSelection && !dotElement.classList.contains('selected')) {
                dotElement.classList.add('selected');
                
                // Use the safely converted HTMLElement
                adjustSelectedBox(dotElement);
                adjustHoverBox(dotElement);
                
                selectedDotsCount++;
            }
        } catch (error) {
            console.error('Error processing dot element:', error);
        }
    });

    // Update the currently selected dot to the last selected dot
    const selectedDots = document.querySelectorAll('.dot-container.selected');
    if (selectedDots.length > 0) {
        try {
            // Convert last selected dot to HTMLElement safely
            const lastSelectedDot = ensureHTMLElement(selectedDots[selectedDots.length - 1]);
            tpf.selectedDot = lastSelectedDot as HTMLDivElement;
        } catch (error) {
            console.error('Error setting selected dot:', error);
        }
    }

    console.log(`Dots selected: ${selectedDotsCount}`);
}
// SELECT and MOVE MULTIPLE DOTS END //

export { 
    tpf,
    mouseMove,
    mouseUp,
    mouseDown,
    adjustHoverBox,
    autosaveDots,
    debounce,
    throttle,
    handleKeyboardMovement,
    handleKeyboardDelete,
    handleMultiDotSelection,
    isSelecting
};