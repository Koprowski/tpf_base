import log from "./util.log";
import { updateConnectingLine } from './utils';
import { adjustHoverBox, createLabelEditor } from './dotsCreate';
import { LABEL_CONNECTION } from './constants';
import { DotState, TPF, UndoAction, DotStateChange } from './types';

// Initialize undo history
const undoHistory: UndoAction[] = [];
const maxUndoHistory = 50;

let tpf: TPF = {
    skipGraphClick: false,
    isDragging: false,
    debug: true,
    offsetX: 0,
    offsetY: 0,
    currentDot: null,
    selectedDot: null,
    xAxisWidth: 0,
    yAxisHeight: 0,
    isLabelBoxDragging: false,
    currentLabelBox: null,
    labelBoxOffset: { x: 0, y: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    const xAxis = document.getElementsByClassName("x-axis")[0] as HTMLElement;
    const yAxis = document.getElementsByClassName("y-axis")[0] as HTMLElement;
    if (xAxis && yAxis) {
        tpf.xAxisWidth = xAxis.clientWidth;
        tpf.yAxisHeight = yAxis.clientHeight;
    }

    document.addEventListener('keydown', handleKeyboardDelete);
    document.addEventListener('keydown', handleUndo);
});

function generateDotId(): string {
    return 'dot-' + Math.random().toString(36).substr(2, 9);
}

function addToUndoHistory(action: UndoAction) {
    undoHistory.push(action);
    if (undoHistory.length > maxUndoHistory) {
        undoHistory.shift();
    }
}

function recordDotState(dot: HTMLElement): DotState {
    const labelEl = dot.querySelector('.user-dot-label');
    const coordsElement = dot.querySelector('.dot-coordinates');
    const labelContainer = dot.querySelector('.label-container') as HTMLElement;
    const line = dot.querySelector('.connecting-line') as HTMLElement;
    
    const labelOffset = labelContainer ? {
        x: parseFloat(labelContainer.style.left) || LABEL_CONNECTION.DEFAULT_LENGTH,
        y: parseFloat(labelContainer.style.top) || -LABEL_CONNECTION.DEFAULT_LENGTH
    } : undefined;

    const lineLength = line ? parseFloat(dot.getAttribute('data-line-length') || '') : undefined;
    const lineAngle = line ? parseFloat(dot.getAttribute('data-line-angle') || '') : undefined;

    return {
        x: dot.style.left,
        y: dot.style.top,
        coordinates: coordsElement?.textContent || '',
        label: labelEl?.textContent || '',
        id: dot.getAttribute('data-dot-id') || generateDotId(),
        labelOffset,
        lineLength,
        lineAngle
    };
}

function updateDotState(dot: HTMLElement, state: DotState) {
    dot.style.left = state.x;
    dot.style.top = state.y;
    const coordsElement = dot.querySelector('.dot-coordinates');
    if (coordsElement) {
        coordsElement.textContent = state.coordinates;
    }
    const labelEl = dot.querySelector('.user-dot-label');
    if (labelEl) {
        labelEl.textContent = state.label;
    }
    if (state.id) {
        dot.setAttribute('data-dot-id', state.id);
    }
}

function handleUndo(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        const lastAction = undoHistory.pop();
        if (!lastAction) return;

        const xyPlane = document.getElementById('xy-plane');
        if (!xyPlane) return;

        try {
            switch (lastAction.type) {
                case 'move':
                    if (lastAction.previousState) {
                        const dot = document.querySelector(`[data-dot-id="${lastAction.dotId}"]`) as HTMLElement;
                        if (dot) {
                            // Store current state for potential redo
                            const currentState = recordDotState(dot);

                            // Update position and state
                            updateDotState(dot, lastAction.previousState);

                            // Update connecting line
                            updateConnectingLine(dot);

                            // Update hover box if selected
                            if (dot.classList.contains('selected')) {
                                adjustHoverBox(dot);
                            }
                            
                            autosaveAfterUndo();
                        }
                    }
                    break;
                case 'delete':
                    if (lastAction.previousState) {
                        // Create new dot with full state
                        const newDot = createDotElement(lastAction.previousState);

                        // Set the position explicitly
                        newDot.style.left = lastAction.previousState.x;
                        newDot.style.top = lastAction.previousState.y;
                        
                        // Add to DOM
                        xyPlane.appendChild(newDot);

                        // Update connecting line and layout
                        requestAnimationFrame(() => {
                            updateConnectingLine(newDot);
                            if (newDot.classList.contains('selected')) {
                                adjustHoverBox(newDot);
                            }
                        });

                        autosaveAfterUndo();
                    }
                    break;
                case 'create':
                    const dotToRemove = document.querySelector(`[data-dot-id="${lastAction.dotId}"]`);
                    if (dotToRemove) {
                        // Store state before removal for potential redo
                        const stateBeforeRemoval = recordDotState(dotToRemove as HTMLElement);

                        // If this was the selected dot, clear selection
                        if (tpf.selectedDot === dotToRemove) {
                            tpf.selectedDot = null;
                        }

                        // Remove any selection classes first
                        dotToRemove.classList.remove('selected', 'multi-selected', 'editing');

                        // Remove the dot
                        dotToRemove.remove();

                        autosaveAfterUndo();
                    }
                    break;
                case 'labelMove':
                    if (lastAction.previousState) {
                        const dot = document.querySelector(`[data-dot-id="${lastAction.dotId}"]`) as HTMLElement;
                        if (dot) {
                            const labelContainer = dot.querySelector('.label-container') as HTMLElement;
                            if (labelContainer && lastAction.previousState.labelOffset) {
                                labelContainer.style.left = `${lastAction.previousState.labelOffset.x}px`;
                                labelContainer.style.top = `${lastAction.previousState.labelOffset.y}px`;
                                updateConnectingLine(dot);
                                autosaveAfterUndo();
                            }
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('Error in undo operation:', error);
        }
    }
}

function createDotElement(state: DotState): HTMLElement {
    const dot = document.createElement('div');
    dot.className = 'dot-container';
    dot.setAttribute('data-dot-id', state.id || generateDotId());
    dot.style.position = 'absolute';
    dot.style.left = state.x;
    dot.style.top = state.y;
    dot.style.transform = 'translate(-50%, -50%)';
    
    try {
        // Create dot element with centered positioning
        const dotElement = document.createElement('div');
        dotElement.className = 'dot';
        dotElement.style.position = 'absolute';
        dotElement.style.top = '50%';
        dotElement.style.left = '50%';
        dotElement.style.transform = 'translate(-50%, -50%)';
        dot.appendChild(dotElement);

        // Get saved label position or use defaults
        const labelOffset = state.labelOffset || {
            x: LABEL_CONNECTION.DEFAULT_LENGTH,
            y: -LABEL_CONNECTION.DEFAULT_LENGTH
        };

        // Calculate line length from offset or use saved value
        const lineLength = state.lineLength || 
            Math.sqrt(labelOffset.x * labelOffset.x + labelOffset.y * labelOffset.y);

        // Calculate line angle from offset or use saved value
        const lineAngle = state.lineAngle || 
            Math.atan2(labelOffset.y, labelOffset.x) * (180 / Math.PI);

        // Create connecting line before label container
        const line = document.createElement('div');
        line.className = 'connecting-line';
        Object.assign(line.style, {
            position: 'absolute',
            width: `${lineLength}px`,
            height: '1px',
            top: '50%',
            left: '50%',
            transform: `rotate(${lineAngle}deg)`,
            transformOrigin: 'left center',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: `${LABEL_CONNECTION.LINE_WIDTH}px solid ${LABEL_CONNECTION.LINE_COLOR}`,
            pointerEvents: 'none',
            display: 'block',
            zIndex: '1'
        });
        dot.appendChild(line);

        // Store line properties
        dot.setAttribute('data-line-length', lineLength.toString());
        dot.setAttribute('data-line-angle', lineAngle.toString());

        // Create label container with stored positioning
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-container';
        Object.assign(labelContainer.style, {
            position: 'absolute',
            left: `${labelOffset.x}px`,
            top: `${labelOffset.y}px`,
            backgroundColor: LABEL_CONNECTION.BOX_BACKGROUND,
            border: `${LABEL_CONNECTION.BOX_BORDER_WIDTH}px solid ${LABEL_CONNECTION.BOX_BORDER_COLOR}`,
            borderRadius: `${LABEL_CONNECTION.BOX_BORDER_RADIUS}px`,
            padding: '8px',
            cursor: 'move',
            whiteSpace: 'nowrap',
            zIndex: '2'
        });

        labelContainer.innerHTML = `
            <div class='user-dot-label'>${state.label}</div>
            <div class='dot-coordinates'>${state.coordinates}</div>
        `;

        // Add double-click handler for label editing
        labelContainer.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const labelElement = labelContainer.querySelector('.user-dot-label') as HTMLElement;
            if (labelElement) {
                createLabelEditor(labelElement, dot);
            }
        });

        dot.appendChild(labelContainer);

        // Store original offset for reference
        dot.setAttribute('data-original-offset', JSON.stringify(labelOffset));

        // Add event listeners
        dot.addEventListener('contextmenu', (e) => e.preventDefault());
        dot.addEventListener('mousedown', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('dot-container')) {
                e.preventDefault();
                tpf.isDragging = true;
                tpf.currentDot = target as HTMLDivElement;
            }
        });

        // Store original coordinates
        dot.setAttribute('data-original-coords', state.coordinates);

        // Force layout calculation and update connecting line
        requestAnimationFrame(() => {
            updateConnectingLine(dot);
            
            // Verify label position after layout
            if (labelContainer && labelOffset) {
                labelContainer.style.left = `${labelOffset.x}px`;
                labelContainer.style.top = `${labelOffset.y}px`;
            }
        });

    } catch (error) {
        console.error('Error creating dot element:', error);
    }

    return dot;
}


async function handleKeyboardDelete(event: KeyboardEvent) {
    if (event.key === 'Delete' && tpf.selectedDot) {
        event.preventDefault();
        
        let previousState: DotState | undefined;
        const dotToDelete = tpf.selectedDot;
        
        try {
            previousState = recordDotState(dotToDelete);
            
            addToUndoHistory({
                type: 'delete',
                dotId: dotToDelete.getAttribute('data-dot-id') || generateDotId(),
                previousState
            });

            dotToDelete.remove();
            tpf.selectedDot = null;
            
            // Only try to save if we're not on the homepage
            const urlParts = window.location.pathname.split('/');
            if (urlParts.length > 2 && urlParts[1] !== '') {
                await autosaveAfterUndo();
            }
            
            const deleteEvent = new CustomEvent('dotDeleted', { bubbles: true });
            document.dispatchEvent(deleteEvent);
            
        } catch (error) {
            console.error('Failed to process delete:', error);
            // Only restore the dot if we were trying to save (not on homepage)
            const urlParts = window.location.pathname.split('/');
            if (urlParts.length > 2 && urlParts[1] !== '' && previousState) {
                const xyPlane = document.getElementById('xy-plane');
                if (xyPlane) {
                    const restoredDot = createDotElement(previousState);
                    xyPlane.appendChild(restoredDot);
                    tpf.selectedDot = restoredDot as HTMLDivElement;
                }
                alert('Failed to delete dot. Please try again.');
            }
        }
    }
}

async function autosaveAfterUndo() {
    try {
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length <= 2 || urlParts[1] === '') {
            return;
        }

        const dots = Array.from(document.getElementsByClassName('dot-container')).map(dotEl => {
            const labelEl = dotEl.querySelector('.user-dot-label');
            const coordsElement = dotEl.querySelector('.dot-coordinates');
            
            const x = (dotEl as HTMLElement).style.left;
            const y = (dotEl as HTMLElement).style.top;

            if (!x || !y) {
                throw new Error('Invalid dot position');
            }

            return {
                x: x,
                y: y,
                coordinates: coordsElement?.textContent || '',
                label: labelEl?.textContent || 'null'
            };
        });
        
        const urlId = urlParts[urlParts.length - 1];
        
        const response = await fetch(`/api/pages/${urlId}/dots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dots }),
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to save dots');
        }

        log('Autosave completed', 'dots');
        return data;

    } catch (error) {
        if (window.location.pathname !== '/' && window.location.pathname !== '/index') {
            console.error('Error saving after undo:', error);
            throw error;
        }
    }
}

export { 
    tpf,
    recordDotState,
    generateDotId,
    addToUndoHistory
};
