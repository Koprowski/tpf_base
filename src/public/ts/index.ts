import { createTickMarks, pixelToCoordinate, coordinateToPixel } from './createTickMarks';
import { tpf } from './data';
import { dotsCreate } from './dotsCreate';
import { dotsLoad } from './dotsLoad';
import { dotsSave } from './dotsSave';
import { mouseDown, mouseUp, mouseMove } from './mouseEvents';
import { removeAnyExistingElementsWithClassName } from './removeAnyExistingElementsWithClassName';
import log from './util.log';
import { initErrorTracker } from './errorTracker';
import './navScroll';

// Extend Window interface to include our global functions
declare global {
    interface Window {
        createTickMarks: typeof createTickMarks;
        pixelToCoordinate: typeof pixelToCoordinate;
        coordinateToPixel: typeof coordinateToPixel;
        dotsCreate: typeof dotsCreate;
        dotsLoad: typeof dotsLoad;
        dotsSave: typeof dotsSave;
        mouseDown: typeof mouseDown;
        mouseUp: typeof mouseUp;
        mouseMove: typeof mouseMove;
        removeAnyExistingElementsWithClassName: typeof removeAnyExistingElementsWithClassName;
        log: typeof log;
        tpf: typeof tpf;
    }
}

// Export everything that needs to be globally available
window.createTickMarks = createTickMarks;
window.pixelToCoordinate = pixelToCoordinate;
window.coordinateToPixel = coordinateToPixel;
window.dotsCreate = dotsCreate;
window.dotsLoad = dotsLoad;
window.dotsSave = dotsSave;
window.mouseDown = mouseDown;
window.mouseUp = mouseUp;
window.mouseMove = mouseMove;
window.removeAnyExistingElementsWithClassName = removeAnyExistingElementsWithClassName;
window.log = log;
window.tpf = tpf;

// Initialize grid when the document loads
document.addEventListener('DOMContentLoaded', function() {
    initErrorTracker();
    log('Document loaded, initializing grid...');
    
    // Initialize grid
    const xyPlane = document.getElementById('xy-plane');
    if (xyPlane) {
        log('Found xy-plane, creating tick marks...');
        try {
            // Global click tracker
            document.addEventListener('click', (e) => {
                console.log('=== Global click event captured ===');
                console.log('Click event details:', {
                    target: e.target,
                    phase: e.eventPhase,
                    defaultPrevented: e.defaultPrevented,
                    bubbles: e.bubbles,
                    cancelBubble: e.cancelBubble,
                    selectedDots: document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length
                });
            }, true);  // Use capture phase to see the event first

            // Create the tick marks first
            createTickMarks(xyPlane);
            log('Tick marks created successfully');

            // Then initialize dots functionality
            dotsCreate();
            log('Dots functionality initialized');

            // Add mouse event listeners
            xyPlane.addEventListener('mousedown', mouseDown);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('mousemove', mouseMove);

            // Prevent default context menu
            xyPlane.addEventListener('contextmenu', function(e) {
                e.preventDefault();
            });

            // Add event listeners for label input
            const labelInputs = document.querySelectorAll('.label-input');
            labelInputs.forEach(labelInput => {
                labelInput.addEventListener('focus', () => {
                    const dotContainer = labelInput.closest('.dot-container');
                    if (dotContainer) {
                        dotContainer.classList.add('editing');
                    }
                });

                labelInput.addEventListener('blur', () => {
                    const dotContainer = labelInput.closest('.dot-container');
                    if (dotContainer) {
                        dotContainer.classList.remove('editing');
                    }
                });

                labelInput.addEventListener('keydown', (event) => {
                    const keyboardEvent = event as KeyboardEvent;
                    const key = keyboardEvent.key;
                    if (key === 'Enter') {
                        const dotContainer = labelInput.closest('.dot-container');
                        if (dotContainer) {
                            dotContainer.classList.add('selected');
                        }
                    }
                });
            });

        } catch (error) {
            console.error('Error initializing grid:', error);
        }
    } else {
        console.error('Could not find xy-plane element');
    }

    // Handle form submission
    const savePageForm = document.getElementById('savePageForm');
    if (savePageForm) {
        savePageForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const pageName = document.getElementById('pageName') as HTMLInputElement;
            if (!pageName.value) {
                alert('Please enter a page name');
                return;
            }

            try {
                // Get all dots with proper formatting for the schema
                const dots = Array.from(document.getElementsByClassName('dot-container')).map(dotEl => {
                    const labelEl = dotEl.querySelector('.user-dot-label');
                    const coordsElement = dotEl.querySelector('.dot-coordinates');
                    
                    return {
                        x: (dotEl as HTMLElement).style.left,
                        y: (dotEl as HTMLElement).style.top,
                        coordinates: coordsElement?.textContent || '',
                        label: labelEl?.textContent || 'null'
                    };
                });

                const response = await fetch('/api/pages/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: pageName.value,
                        content: pageName.value,
                        dots: dots
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save page');
                }

                const result = await response.json();
                console.log('Page saved successfully:', result);
                window.location.href = '/dashboard';

            } catch (error) {
                console.error('Error saving page:', error);
                if (error instanceof Error) {
                    alert(`Error saving page: ${error.message}`);
                } else {
                    alert('Error saving page. Please try again.');
                }
            }
        });
    }

    // Initialize any saved dots if they exist
    try {
        // Only try to load dots if we're not on the homepage
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] !== '') {
            dotsLoad();
        }
    } catch (error) {
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] !== '') {
            console.error('Error loading saved dots:', error);
        }
    }
});

// Clean up function to remove event listeners when needed
function cleanup() {
    const xyPlane = document.getElementById('xy-plane');
    if (xyPlane) {
        xyPlane.removeEventListener('mousedown', mouseDown);
        window.removeEventListener('mouseup', mouseUp);
        window.removeEventListener('mousemove', mouseMove);
    }
}

// Export functions for use in other modules if needed
export {
    createTickMarks,
    pixelToCoordinate,
    coordinateToPixel,
    dotsCreate,
    dotsLoad,
    dotsSave,
    mouseDown,
    mouseUp,
    mouseMove,
    removeAnyExistingElementsWithClassName,
    log,
    cleanup
};