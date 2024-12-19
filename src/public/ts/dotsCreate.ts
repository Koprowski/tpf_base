import { tpf } from "./data";
import { removeAnyExistingElementsWithClassName } from "./removeAnyExistingElementsWithClassName";
import log from "./util.log";
import { mouseDown, mouseUp, mouseMove,isSelecting } from "./mouseEvents";
import { dotsSave, autosaveDots } from "./dotsSave";
import { pixelToCoordinate, coordinateToPixel } from "./createTickMarks";
import { DOT_BOX, LABEL_CONNECTION } from './constants';
import { SavedDot } from './types';
import { startLabelBoxDrag } from './utils';
import { editDeleteMenu } from './editDeleteMenu';
import { loadSavedDots } from "./dotsLoad";

// Generate a unique ID for dots
function generateDotId(): string {
    return 'dot-' + Math.random().toString(36).substr(2, 9);
}

// Main Dot Creation Function
function dotsCreate() {
    log("createDots");
    const xyPlane = document.getElementById("xy-plane");
    if (!xyPlane) return;
    
    xyPlane.addEventListener('click', (e) => {
        console.log('XYPlane click:', {
            target: e.target,
            defaultPrevented: e.defaultPrevented,
            cancelBubble: e.cancelBubble
        });

        console.log('Current dot states:', {
            selectedDotCount: document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length,
            isDragging: tpf.isDragging,
            isSelecting,
            skipGraphClick: tpf.skipGraphClick,
            currentDot: tpf.currentDot ? true : false,
            eventPreventDefault: e.defaultPrevented,
            eventPropagationStopped: e.cancelBubble
        });
        
         // Return early if event was already handled
        if (e.defaultPrevented) {
            console.log('Event was already handled, returning early');
            return;
        }

        // Handle dot selection/deselection
        const target = e.target as HTMLElement;
        const dotContainer = findDotContainer(target);
        const hasSelectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length > 0;

        if (hasSelectedDots && target === xyPlane) {
            console.log('Selected dots exist and clicking xy-plane - preventing creation');
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // If we clicked on a dot
        if (dotContainer && !dotContainer.classList.contains('editing')) {
            // If clicking on the currently selected dot, deselect it
            if (dotContainer === tpf.selectedDot) {
                const coordsElement = dotContainer.querySelector('.dot-coordinates');
                if (coordsElement) {
                    // Store the current coordinates before deselecting
                    const currentCoords = coordsElement.textContent || '';
                    dotContainer.setAttribute('data-original-coords', currentCoords);
                }
                dotContainer.classList.remove('selected');
                adjustHoverBox(dotContainer);
                adjustSelectedBox(dotContainer);
                tpf.selectedDot = null;
            } else {
                // If clicking on a different dot, deselect the old one and select the new one
                if (tpf.selectedDot) {
                    const oldCoordsElement = tpf.selectedDot.querySelector('.dot-coordinates');
                    if (oldCoordsElement) {
                        const currentCoords = oldCoordsElement.textContent || '';
                        tpf.selectedDot.setAttribute('data-original-coords', currentCoords);
                    }
                    tpf.selectedDot.classList.remove('selected');
                    adjustHoverBox(tpf.selectedDot);
                    adjustSelectedBox(tpf.selectedDot);
                }
                // Select the new dot
                dotContainer.classList.add('selected');
                tpf.selectedDot = dotContainer;
                adjustHoverBox(dotContainer);
                adjustSelectedBox(dotContainer);
            }
            e.stopPropagation();
            return;
        }
        
        // If clicking on whitespace while a dot is selected
        if (tpf.selectedDot && !dotContainer) {
            const coordsElement = tpf.selectedDot.querySelector('.dot-coordinates');
            if (coordsElement) {
                // Store the current coordinates before deselecting
                const currentCoords = coordsElement.textContent || '';
                tpf.selectedDot.setAttribute('data-original-coords', currentCoords);
            }
            
            // Deselect the current dot
            tpf.selectedDot.classList.remove('selected');
            adjustHoverBox(tpf.selectedDot);
            tpf.selectedDot = null;
            e.stopPropagation();
            return;
        }

        // Only proceed to dot creation if we haven't handled a selection action
        if (!tpf.selectedDot) {
            xyPlaneClickHandler(e);
        }
    });

    function xyPlaneClickHandler(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const xyPlane = document.getElementById('xy-plane');
        if (!xyPlane) return;
        
        // Skip if clicking on dot elements
        if (target.classList.contains('dot') || 
            target.classList.contains('dot-container') ||
            target.classList.contains('coordinate-text') ||
            target.classList.contains('user-dot-label') ||
            target.classList.contains('dot-coordinates')) {
            return;
        }

        // If there was any drag movement, don't create a dot
        if (isSelecting || tpf.isDragging) {
            return;
        }

        // Check for any selected or multi-selected dots
        const selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        
        // If there are selected dots, just clear the selection and return
        if (selectedDots.length > 0) {
            selectedDots.forEach(dot => {
                dot.classList.remove('selected');
                dot.classList.remove('multi-selected');
                adjustHoverBox(dot as HTMLElement);
                adjustSelectedBox(dot as HTMLElement);
            });
            tpf.selectedDot = null;
            return;
        }

        const rawCoords = getGraphRawCoordinates(event);
        const graphCoords = {
            x: pixelToCoordinate(rawCoords.x),
            y: -pixelToCoordinate(rawCoords.y)
        };
        
        const pixelPosition = {
            x: coordinateToPixel(graphCoords.x),
            y: coordinateToPixel(-graphCoords.y)
        };

        const adjustedPosition = {
            x: pixelPosition.x,
            y: pixelPosition.y
        };

        const dotId = generateDotId();
        const savedDot: SavedDot = {
            x: adjustedPosition.x + 'px',
            y: adjustedPosition.y + 'px',
            coordinates: `(${graphCoords.x.toFixed(2)}, ${graphCoords.y.toFixed(2)})`,
            label: '',
            id: dotId,
            labelOffset: {
                x: LABEL_CONNECTION.DEFAULT_LENGTH,
                y: -LABEL_CONNECTION.DEFAULT_LENGTH
            }
        };

        if (isClickInsideGraph(graphCoords)) {
            if (tpf.currentDot === null) {
                try {
                    const dot = loadSavedDots(savedDot);
                    xyPlane.appendChild(dot);
                    
                    // Update connecting line after adding to DOM
                    requestAnimationFrame(() => {
                        updateConnectingLine(dot);
                    });

                    // Start label editing
                    const labelElement = dot.querySelector('.user-dot-label') as HTMLElement;
                    if (labelElement) {
                        setTimeout(() => {
                            createLabelEditor(labelElement, dot);
                        }, 0);
                    }

                    // Fire creation event
                    const createAction = {
                        type: 'create' as const,
                        dotId: dotId,
                        newState: savedDot
                    };
                    document.dispatchEvent(new CustomEvent('dotCreated', {
                        bubbles: true,
                        detail: createAction
                    }));

                    // Autosave if not on homepage
                    const urlParts = window.location.pathname.split('/');
                    if (urlParts.length > 2 && urlParts[1] !== '') {
                        autosaveDots();
                    }
                } catch (error) {
                    console.error('Error in dot creation:', error);
                }
            }
        }
    }

}

// Helper Dot Creation Function
function createNewDot(savedDot: SavedDot, xyPlane: HTMLElement) {
    console.log('Creating new dot:', {
        position: { x: savedDot.x, y: savedDot.y },
        coordinates: savedDot.coordinates,
        id: savedDot.id
    });

    try {
        // Create container
        const dot = document.createElement('div');
        dot.classList.add('dot-container');
        dot.classList.add('editing');
        dot.setAttribute('data-dot-id', savedDot.id ?? '');
        dot.style.position = 'absolute';
        dot.style.left = savedDot.x;
        dot.style.top = savedDot.y;

        // Create dot element with centered positioning
        const dotElement = document.createElement('div');
        dotElement.className = 'dot';
        dotElement.style.position = 'absolute';
        dotElement.style.top = '50%';
        dotElement.style.left = '50%';
        dotElement.style.transform = 'translate(-50%, -50%)';
        dot.appendChild(dotElement);

        // Calculate dot dimensions for centering
        const dotRect = dotElement.getBoundingClientRect();
        const dotRadius = dotRect.width / 2;

        console.log('Dot element measurements:', {
            rect: dotRect,
            radius: dotRadius
        });

        // Create label container first so we can measure it
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-container';
        Object.assign(labelContainer.style, {
            position: 'absolute',
            left: `${savedDot.labelOffset?.x ?? LABEL_CONNECTION.DEFAULT_LENGTH}px`,
            backgroundColor: LABEL_CONNECTION.BOX_BACKGROUND,
            border: `${LABEL_CONNECTION.BOX_BORDER_WIDTH}px solid ${LABEL_CONNECTION.BOX_BORDER_COLOR}`,
            borderRadius: `${LABEL_CONNECTION.BOX_BORDER_RADIUS}px`,
            padding: '8px',
            cursor: 'move',
            whiteSpace: 'nowrap',
            zIndex: '2'
        });

        labelContainer.innerHTML = `
            <div class='user-dot-label'></div>
            <div class='dot-coordinates'>${savedDot.coordinates}</div>
        `;

        dot.appendChild(labelContainer);
        
        // Force a layout calculation
        dot.offsetHeight;
        labelContainer.offsetHeight;

        // Create connecting line after label container
        const line = document.createElement('div');
        line.className = 'connecting-line';
        
        // Initial line setup with explicit positioning
        Object.assign(line.style, {
            position: 'absolute',
            width: `${LABEL_CONNECTION.DEFAULT_LENGTH}px`,
            height: '1px',
            top: '50%',
            left: '50%',
            transform: 'rotate(0deg)', // Initial straight position
            transformOrigin: 'left center',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: `${LABEL_CONNECTION.LINE_WIDTH}px solid ${LABEL_CONNECTION.LINE_COLOR}`,
            pointerEvents: 'none',
            display: 'block',
            zIndex: '1'
        });

        dot.insertBefore(line, labelContainer);

        // Store initial line properties
        dot.setAttribute('data-line-length', LABEL_CONNECTION.DEFAULT_LENGTH.toString());
        dot.setAttribute('data-line-angle', '0');

        // Add event listeners
        labelContainer.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const labelElement = labelContainer.querySelector('.user-dot-label') as HTMLElement;
            if (labelElement) {
                createLabelEditor(labelElement, dot);
            }
        });

        dot.addEventListener("contextmenu", mouseContextmenu);
        dot.addEventListener('mousedown', mouseDown);
        dot.addEventListener('mouseup', mouseUp);
        window.addEventListener('mousemove', mouseMove, false);

        // Add to DOM
        xyPlane.appendChild(dot);
        
        // Immediately calculate and set the correct line position
        updateConnectingLine(dot);
        
        // Set up label editing
        const labelElement = dot.querySelector('.user-dot-label') as HTMLElement;
        if (labelElement) {
            setTimeout(() => {
                createLabelEditor(labelElement, dot);
            }, 0);
        }

        // Verify final structure
        const finalMeasurements = {
            dotRect: dotElement.getBoundingClientRect(),
            lineRect: line.getBoundingClientRect(),
            labelRect: labelContainer.getBoundingClientRect()
        };

        console.log('Final dot verification:', {
            id: dot.getAttribute('data-dot-id'),
            position: {
                left: dot.style.left,
                top: dot.style.top
            },
            measurements: finalMeasurements,
            lineProperties: {
                length: dot.getAttribute('data-line-length'),
                angle: dot.getAttribute('data-line-angle'),
                transform: line.style.transform
            }
        });

        return dot;

    } catch (error) {
        console.error('Error creating new dot:', error);
        if (error instanceof Error) {
            console.error('Creation error details:', {
                message: error.message,
                stack: error.stack
            });
        }
        throw error;
    }
}

function updateConnectingLine(dot: HTMLElement) {
    const line = dot.querySelector('.connecting-line') as HTMLElement;
    const labelContainer = dot.querySelector('.label-container') as HTMLElement;
    const dotElement = dot.querySelector('.dot') as HTMLElement;
    
    if (!line || !labelContainer || !dotElement) {
        console.warn('Missing elements:', { line: !!line, label: !!labelContainer, dot: !!dotElement });
        return;
    }

    // Force layout calculation to ensure accurate measurements
    dot.offsetHeight;
    labelContainer.offsetHeight;

    // Get dimensions after layout is complete
    const labelBox = labelContainer.getBoundingClientRect();
    const dotBox = dotElement.getBoundingClientRect();
    const containerRect = dot.getBoundingClientRect();
    
    // Calculate center points
    const dotCenterX = dotBox.left - containerRect.left + dotBox.width / 2;
    const dotCenterY = dotBox.top - containerRect.top + dotBox.height / 2;
    const labelCenterY = labelBox.top - containerRect.top + labelBox.height / 2;
    const labelLeftX = labelBox.left - containerRect.left;

    const dx = labelLeftX - dotCenterX;
    const dy = labelCenterY - dotCenterY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy);

    console.log('Line calculation:', {
        measurements: {
            dotCenter: { x: dotCenterX, y: dotCenterY },
            labelCenter: { x: labelLeftX, y: labelCenterY },
            dx,
            dy,
            angle,
            length
        }
    });

    try {
        // Update line properties in a single operation
        Object.assign(line.style, {
            position: 'absolute',
            width: `${length}px`,
            height: '1px',
            top: '50%',
            left: '50%',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'left center',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: `${LABEL_CONNECTION.LINE_WIDTH}px solid ${LABEL_CONNECTION.LINE_COLOR}`,
            display: 'block',
            zIndex: '1',
            pointerEvents: 'none'
        });

        dot.setAttribute('data-line-length', length.toString());
        dot.setAttribute('data-line-angle', angle.toString());

        // Verify final positioning
        const finalLineBox = line.getBoundingClientRect();
        console.log('Final line state:', {
            dotId: dot.getAttribute('data-dot-id'),
            dimensions: {
                width: finalLineBox.width,
                height: finalLineBox.height
            },
            styles: {
                transform: line.style.transform,
                width: line.style.width,
                top: line.style.top,
                left: line.style.left
            },
            labelPosition: {
                left: labelContainer.style.left,
                top: labelContainer.style.top
            }
        });

    } catch (error) {
        console.error('Error updating connecting line:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dot: dot.getAttribute('data-dot-id'),
            measurements: { length, angle }
        });
    }
}


// dot-container hover & Selected box

function adjustHoverBox(dot: Element): void {
    // Convert to HTMLElement if not already
    const dotElement = dot instanceof HTMLElement 
        ? dot 
        : dot.classList.contains('dot-container') 
            ? dot as HTMLElement 
            : document.createElement('div');
    
    const labelElement = dotElement.querySelector('.user-dot-label');
    const coordsElement = dotElement.querySelector('.dot-coordinates');
    
    if (!labelElement || !coordsElement) return;
    
    const labelRect = labelElement.getBoundingClientRect();
    const coordsRect = coordsElement.getBoundingClientRect();
    
    const totalWidth = Math.max(DOT_BOX.MIN_WIDTH, Math.max(labelRect.width, coordsRect.width) + DOT_BOX.LEFT_PADDING);
    const totalHeight = Math.max(DOT_BOX.MIN_HEIGHT, coordsRect.bottom - labelRect.top + 10);
    
    dotElement.style.setProperty('--hover-width', `${totalWidth}px`);
    dotElement.style.setProperty('--hover-height', `${totalHeight}px`);
    dotElement.style.setProperty('--hover-top', `${DOT_BOX.TOP_OFFSET}px`);
    dotElement.style.setProperty('--hover-left', `-${DOT_BOX.DOT_WIDTH/2+2}px`);
}

function adjustSelectedBox(dot: Element): void {
    // Convert to HTMLElement if not already
    const dotElement = dot instanceof HTMLElement 
        ? dot 
        : dot.classList.contains('dot-container') 
            ? dot as HTMLElement 
            : document.createElement('div');
    
    const labelElement = dotElement.querySelector('.user-dot-label');
    const coordsElement = dotElement.querySelector('.dot-coordinates');
    
    if (!labelElement || !coordsElement) return;
    
    const labelRect = labelElement.getBoundingClientRect();
    const coordsRect = coordsElement.getBoundingClientRect();
    
    const totalWidth = Math.max(DOT_BOX.MIN_WIDTH, Math.max(labelRect.width, coordsRect.width) + DOT_BOX.LEFT_PADDING);
    const totalHeight = Math.max(DOT_BOX.MIN_HEIGHT, coordsRect.bottom - labelRect.top + 10);
    
    dotElement.style.setProperty('--hover-width', `${totalWidth}px`);
    dotElement.style.setProperty('--hover-height', `${totalHeight}px`);
    dotElement.style.setProperty('--hover-top', `${DOT_BOX.TOP_OFFSET}px`);
    dotElement.style.setProperty('--hover-left', `-${DOT_BOX.DOT_WIDTH/2+2}px`);
}

function updateCoordinatePrecision(dotContainer: HTMLDivElement, highPrecision: boolean) {
    const coordsElement = dotContainer.querySelector('.dot-coordinates');
    if (!coordsElement) return;
    
    // Keep using the exactly calculated coordinates
    const currentCoords = coordsElement.textContent || '';
    dotContainer.setAttribute('data-original-coords', currentCoords);
}

function xyPlaneClickHandler(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('dot') || 
        target.classList.contains('dot-container') ||
        target.classList.contains('coordinate-text') ||
        target.classList.contains('user-dot-label') ||
        target.classList.contains('dot-coordinates')) {
        return;
    }

    const rawCoords = getGraphRawCoordinates(event);
    const graphCoords = {
        x: pixelToCoordinate(rawCoords.x),
        y: -pixelToCoordinate(rawCoords.y)
    };
    
    const pixelPosition = {
        x: coordinateToPixel(graphCoords.x),
        y: coordinateToPixel(-graphCoords.y)
    };

    const adjustedPosition = {
        x: pixelPosition.x,
        y: pixelPosition.y
    };

    const dotId = generateDotId();
    const savedDot: SavedDot = {
        x: adjustedPosition.x + 'px',
        y: adjustedPosition.y + 'px',
        coordinates: `(${graphCoords.x.toFixed(2)}, ${graphCoords.y.toFixed(2)})`,
        // For display purposes, we'll format this differently when rendering
        displayCoordinates: `(${graphCoords.x.toFixed(1)}, ${graphCoords.y.toFixed(1)})`,
        label: '',
        id: dotId,
        labelOffset: {
            x: LABEL_CONNECTION.DEFAULT_LENGTH,
            y: -LABEL_CONNECTION.DEFAULT_LENGTH
        }
    };

    if (isClickInsideGraph(graphCoords)) {
        if (tpf.currentDot === null) {
            const dot = addDot();
            dot.setAttribute('data-dot-id', dotId);
            dot.style.left = savedDot.x;
            dot.style.top = savedDot.y;
            
            const dotElement = document.createElement('div');
            dotElement.className = 'dot';
            dotElement.style.position = 'absolute';
            dotElement.style.top = '50%';
            dotElement.style.left = '50%';
            dotElement.style.transform = 'translate(-50%, -50%)';

            const line = document.createElement('div');
            line.className = 'connecting-line';
            line.style.position = 'absolute';
            line.style.width = `${LABEL_CONNECTION.DEFAULT_LENGTH}px`; 
            line.style.height = '1px';
            line.style.top = '50%';
            line.style.left = '50%';
            line.style.transformOrigin = 'left center';
            line.style.backgroundColor = LABEL_CONNECTION.LINE_COLOR;
            line.style.borderTop = `${LABEL_CONNECTION.LINE_WIDTH}px solid ${LABEL_CONNECTION.LINE_COLOR}`;
            line.style.pointerEvents = 'none';
            line.style.display = 'block';
            line.style.visibility = 'visible';
            line.style.zIndex = '1';

            const labelContainer = document.createElement('div');
            labelContainer.className = 'label-container';
            labelContainer.style.position = 'absolute';
            labelContainer.style.backgroundColor = LABEL_CONNECTION.BOX_BACKGROUND;
            labelContainer.style.border = `${LABEL_CONNECTION.BOX_BORDER_WIDTH}px solid ${LABEL_CONNECTION.BOX_BORDER_COLOR}`;
            labelContainer.style.borderRadius = `${LABEL_CONNECTION.BOX_BORDER_RADIUS}px`;
            labelContainer.style.padding = '8px';
            labelContainer.style.cursor = 'move';
            labelContainer.style.zIndex = '2';

            const labelOffset = savedDot.labelOffset || {
                x: LABEL_CONNECTION.DEFAULT_LENGTH,
                y: -LABEL_CONNECTION.DEFAULT_LENGTH
            };

            labelContainer.style.left = `${labelOffset.x}px`;
            labelContainer.style.top = `${labelOffset.y}px`;

            labelContainer.innerHTML = `
                <div class='user-dot-label'>${savedDot.label || ''}</div>
                <div class='dot-coordinates'>${savedDot.coordinates}</div>
            `;

            dot.appendChild(dotElement);
            dot.appendChild(line);
            dot.appendChild(labelContainer);

            dot.classList.add('editing');

            labelContainer.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const labelElement = labelContainer.querySelector('.user-dot-label') as HTMLElement;
                if (labelElement) {
                    createLabelEditor(labelElement, dot);
                }
            });

            dot.addEventListener("contextmenu", mouseContextmenu);
            dot.addEventListener('mousedown', mouseDown);
            dot.addEventListener('mouseup', mouseUp);
            window.addEventListener('mousemove', mouseMove, false);

            const xyPlane = document.getElementById('xy-plane');
            if (xyPlane) {
                const dot = createNewDot(savedDot, xyPlane);
                xyPlane.appendChild(dot);
                updateConnectingLine(dot);
                const labelElement = dot.querySelector('.user-dot-label') as HTMLElement;
                if (labelElement) {
                    setTimeout(() => {
                        createLabelEditor(labelElement, dot);
                    }, 0);
                }

                const createAction = {
                    type: 'create' as const,
                    dotId: dotId,
                    newState: savedDot
                };
                document.dispatchEvent(new CustomEvent('dotCreated', {
                    bubbles: true,
                    detail: createAction
                }));

                const urlParts = window.location.pathname.split('/');
                if (urlParts.length > 2 && urlParts[1] !== '') {
                    autosaveDots();
                }
            } 
        }
    }
}

function createLabelEditor(labelElement: HTMLElement, dotContainer: HTMLDivElement) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'label-input';

    // Pre-populate the input with the current label text
    input.value = labelElement.textContent || '';

    const labelRect = labelElement.getBoundingClientRect();
    const containerRect = dotContainer.getBoundingClientRect();
    
    input.style.top = (labelRect.top - containerRect.top) + 'px';
    input.style.left = (labelRect.left - containerRect.left) + 'px';
    
    let isEscPressed = false;
    let isFinishing = false;
    
    labelElement.style.visibility = 'hidden';
    
    // Use setTimeout to ensure cursor placement after focus
    setTimeout(() => {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }, 0);

    const finishEdit = async () => {
        if (isEscPressed) return;
        
        try {
            const previousLabel = labelElement.textContent || '';
            const newLabel = input.value || 'null';
            
            labelElement.textContent = newLabel;
            labelElement.style.visibility = 'visible';
            
            dotContainer.classList.remove('editing');
            
            if (tpf.selectedDot && tpf.selectedDot !== dotContainer) {
                tpf.selectedDot.classList.remove('selected');
                updateCoordinatePrecision(tpf.selectedDot, false);
                adjustHoverBox(tpf.selectedDot);
            }
            
            if (input && input.parentNode === dotContainer) {
                dotContainer.removeChild(input);
            }
            
            tpf.selectedDot = dotContainer;
            dotContainer.classList.add('selected');
            updateCoordinatePrecision(dotContainer, true);
            adjustHoverBox(dotContainer);
            
            const labelChangeEvent = new CustomEvent('dotLabelChanged', {
                bubbles: true,
                detail: {
                    dotId: dotContainer.getAttribute('data-dot-id'),
                    previousLabel,
                    newLabel
                }
            });
            document.dispatchEvent(labelChangeEvent);
            
            // Check if we're not on homepage before saving
            const urlParts = window.location.pathname.split('/');
            if (urlParts.length > 2 && urlParts[1] !== '') {
                try {
                    const dots = Array.from(document.getElementsByClassName('dot-container')).map(dotEl => {
                        const labelEl = dotEl.querySelector('.user-dot-label');
                        const coordsElement = dotEl.querySelector('.dot-coordinates');
                        return {
                            x: (dotEl as HTMLElement).style.left,
                            y: (dotEl as HTMLElement).style.top,
                            coordinates: coordsElement?.textContent || '',
                            label: labelEl?.textContent || 'null'};
                        });
                        
                        await dotsSave(dots);
                        await autosaveDots();
                    } catch (error) {
                        console.error('Error saving dots:', error);
                    }
                }
                
            } catch (error) {
                console.error('Error in finishEdit:', error);
                if (labelElement) {
                    labelElement.style.visibility = 'visible';
                }
            }
        };
        
        input.addEventListener('blur', () => {
            if (isFinishing || isEscPressed) return;
            isFinishing = true;
            
            requestAnimationFrame(() => {
                if (!isEscPressed) {
                    finishEdit();
                }
                labelElement.style.visibility = 'visible';
                isFinishing = false;
            });
        });
    
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!isFinishing) {
                    isFinishing = true;
                    await finishEdit();
                    labelElement.style.visibility = 'visible';
                    isFinishing = false;
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                isEscPressed = true;
    
                const dotState = {
                    x: dotContainer.style.left,
                    y: dotContainer.style.top,
                    coordinates: dotContainer.querySelector('.dot-coordinates')?.textContent || '',
                    label: '',
                    id: dotContainer.getAttribute('data-dot-id') || ''
                };
    
                if (input.parentNode === dotContainer) {
                    dotContainer.removeChild(input);
                }
                
                if (dotContainer.parentNode) {
                    dotContainer.parentNode.removeChild(dotContainer);
                }
                
                labelElement.style.visibility = 'visible';
    
                const cancelEvent = new CustomEvent('dotCreateCanceled', {
                    bubbles: true,
                    detail: { dotState }
                });
                document.dispatchEvent(cancelEvent);
                
                // Check if we're not on homepage before autosaving
                const urlParts = window.location.pathname.split('/');
                if (urlParts.length > 2 && urlParts[1] !== '') {
                    try {
                        await autosaveDots();
                    } catch (error) {
                        console.error('Error saving after cancel:', error);
                    }
                }
            }
        });
    
        dotContainer.appendChild(input);
        input.focus();
        input.select();
    }
    
function mouseContextmenu(event: Event) {
    log('dot.contextmenu');
    event.preventDefault();
    removeAnyExistingElementsWithClassName('edit-menu');
    
    const target = event.target as HTMLElement;
    const dotContainer = findDotContainer(target);
    if (dotContainer) {
        editDeleteMenu(dotContainer);
    }
    
    tpf.currentDot = null;
}

function findDotContainer(element: HTMLElement): HTMLDivElement | null {
    if (element.classList.contains('dot-container')) {
        return element as HTMLDivElement;
    }
    if (element.parentElement) {
        return findDotContainer(element.parentElement);
    }
    return null;
}

function isClickInsideGraph(coords: { x: number; y: number; }) {
    return coords.x >= -5 && 
            coords.x <= 5 && 
            coords.y >= -5 && 
            coords.y <= 5;
}

function getGraphRawCoordinates(event: MouseEvent) {
    const xyPlane = document.getElementById('xy-plane');
    if (!xyPlane) throw new Error('xy-plane not found');
    
    const rect = xyPlane.getBoundingClientRect();
    const x = event.clientX - rect.left +0; // Subtract half dot height (4px/2)
    const y = event.clientY - rect.top +0;  // Subtract half dot height (4px/2)
    return { x, y };
}

function addDot() {
    const dot = document.createElement("div");
    dot.classList.add("dot-container");
    dot.classList.add("editing");
    return dot;
}
    
function inspectDotStructure(dot: HTMLElement) {
    // Get all elements
    const line = dot.querySelector('.connecting-line');
    const label = dot.querySelector('.label-container');
    const dotElement = dot.querySelector('.dot');

    log('Dot container structure:', 'debug', {
        dotContainer: {
            classList: Array.from(dot.classList),
            style: {
                position: dot.style.position,
                left: dot.style.left,
                top: dot.style.top,
                transform: dot.style.transform
            }
        },
        line: line ? {
            classList: Array.from(line.classList),
            style: {
                position: (line as HTMLElement).style.position,
                width: (line as HTMLElement).style.width,
                height: (line as HTMLElement).style.height,
                transform: (line as HTMLElement).style.transform,
                backgroundColor: (line as HTMLElement).style.backgroundColor
            }
        } : null,
        label: label ? {
            classList: Array.from(label.classList),
            style: {
                position: (label as HTMLElement).style.position,
                left: (label as HTMLElement).style.left,
                top: (label as HTMLElement).style.top
            }
        } : null,
        dotElement: dotElement ? {
            classList: Array.from(dotElement.classList),
            style: {
                position: (dotElement as HTMLElement).style.position,
                left: (dotElement as HTMLElement).style.left,
                top: (dotElement as HTMLElement).style.top
            }
        } : null
    });
}

export {
dotsCreate,
updateConnectingLine,
adjustHoverBox,
adjustSelectedBox,
createLabelEditor
};