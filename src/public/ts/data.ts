import { dotsSave } from "./dotsSave";
import log from "./util.log";

interface TPF {
    skipGraphClick: boolean;
    isDragging: boolean;
    debug: boolean;
    offsetX: number;
    offsetY: number;
    currentDot: HTMLDivElement | null | undefined;
    selectedDot: HTMLDivElement | null;
    xAxisWidth: number;
    yAxisHeight: number;
    lastMouseUpdate?: number;
    isLabelBoxDragging: boolean;  // New property for label box dragging
    currentLabelBox: HTMLDivElement | null;  // New property for current label box
    labelBoxOffset: { x: number; y: number }; // New property for label box drag offset
}

interface DotState {
    x: string;
    y: string;
    coordinates: string;
    label: string;
    id?: string;
    labelOffset?: { x: number; y: number }; // New property for label position
    lineLength?: number;  // New property for connecting line length
}

interface UndoAction {
    type: 'move' | 'delete' | 'create' | 'labelMove';  // Added labelMove type
    dotId: string;
    previousState?: DotState;
    newState?: DotState;
}

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
    return {
        x: dot.style.left,
        y: dot.style.top,
        coordinates: coordsElement?.textContent || '',
        label: labelEl?.textContent || '',
        id: dot.getAttribute('data-dot-id') || generateDotId()
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

        switch (lastAction.type) {
            case 'move':
                if (lastAction.previousState) {
                    const dot = document.querySelector(`[data-dot-id="${lastAction.dotId}"]`) as HTMLElement;
                    if (dot) {
                        updateDotState(dot, lastAction.previousState);
                        autosaveAfterUndo();
                    }
                }
                break;
                
            case 'delete':
                if (lastAction.previousState) {
                    const newDot = createDotElement(lastAction.previousState);
                    xyPlane.appendChild(newDot);
                    autosaveAfterUndo();
                }
                break;
                
            case 'create':
                const dotToRemove = document.querySelector(`[data-dot-id="${lastAction.dotId}"]`);
                if (dotToRemove) {
                    dotToRemove.remove();
                    autosaveAfterUndo();
                }
                break;
        }
    }
}

function createDotElement(state: DotState): HTMLElement {
    const dot = document.createElement('div');
    dot.className = 'dot-container';
    dot.setAttribute('data-dot-id', state.id || generateDotId());
    dot.style.transform = 'translate(-50%, -50%)';
    updateDotState(dot, state);
    
    dot.innerHTML = `
        <div class='dot' style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
        <div class='coordinate-text' style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%);">
            <div class='user-dot-label' style='position: relative; margin-bottom: 4px;'>${state.label}</div>
            <div class='dot-coordinates' style='position: relative;'>${state.coordinates}</div>
        </div>
    `;

    dot.addEventListener('contextmenu', (e) => e.preventDefault());
    dot.addEventListener('mousedown', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('dot-container')) {
            e.preventDefault();
            tpf.isDragging = true;
            tpf.currentDot = target as HTMLDivElement;
        }
    });

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
