import { DEBUG } from './constants';
import { DotElements } from './types';
import { LABEL_CONNECTION } from './constants';

export function updateConnectingLine(dot: HTMLElement) {
    const line = dot.querySelector('.connecting-line') as HTMLElement;
    const labelContainer = dot.querySelector('.label-container') as HTMLElement;
    const dotElement = dot.querySelector('.dot') as HTMLElement;
    
    if (!line || !labelContainer || !dotElement) {
        if (DEBUG) {
            console.warn('Missing elements:', { line: !!line, label: !!labelContainer, dot: !!dotElement });
        }
        return;
    }

    // Get dimensions before any transforms
    const originalLabelBox = labelContainer.getBoundingClientRect();
    const originalDotBox = dotElement.getBoundingClientRect();
    const containerRect = dot.getBoundingClientRect();
    
    // Calculate center points
    const dotCenterX = originalDotBox.left - containerRect.left + originalDotBox.width / 2;
    const dotCenterY = originalDotBox.top - containerRect.top + originalDotBox.height / 2;
    const labelCenterX = originalLabelBox.left - containerRect.left;
    const labelCenterY = originalLabelBox.top - containerRect.top + originalLabelBox.height / 2;

    // Connect to left edge of label at vertical center
    const labelLeftX = originalLabelBox.left - containerRect.left;

    const dx = labelLeftX - dotCenterX;
    const dy = labelCenterY - dotCenterY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const length = Math.sqrt(dx * dx + dy * dy);

    try {
        const baseStyles = {
            position: 'absolute',
            width: `${length}px`,
            height: '1px',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: `${LABEL_CONNECTION.LINE_WIDTH}px solid ${LABEL_CONNECTION.LINE_COLOR}`,
            display: 'block',
            visibility: 'visible',
            zIndex: '1',
            pointerEvents: 'none',
            transform: `rotate(${angle}deg)`
        };

        const defaultPosition = {
            top: LABEL_CONNECTION.LINE_POSITION.TOP,
            left: LABEL_CONNECTION.LINE_POSITION.LEFT,
        };

        if (!dotElement.hasAttribute('data-line-position')) {
            // First time positioning
            Object.assign(line.style, {
                ...baseStyles,
                ...defaultPosition
            });
            dotElement.setAttribute('data-line-position', JSON.stringify(defaultPosition));
            
            if (DEBUG) {
                console.log('Initial line position set:', {
                    dotId: dot.getAttribute('data-dot-id'),
                    position: defaultPosition
                });
            }
        } else {
            // Restore saved position
            const storedPosition = JSON.parse(dotElement.getAttribute('data-line-position') || '{}');
            Object.assign(line.style, {
                ...baseStyles,
                ...storedPosition
            });
            
            if (DEBUG) {
                console.log('Restored line position:', {
                    dotId: dot.getAttribute('data-dot-id'),
                    position: storedPosition
                });
            }
        }

        dot.setAttribute('data-line-length', length.toString());
        dot.setAttribute('data-line-angle', angle.toString());
        line.classList.add('active-line');

        const finalLineBox = line.getBoundingClientRect();
        if (finalLineBox.width === 0 || finalLineBox.height === 0) {
            console.warn('Invalid line dimensions:', {
                width: finalLineBox.width,
                height: finalLineBox.height,
                styles: {
                    transform: line.style.transform,
                    width: line.style.width,
                    display: line.style.display
                }
            });
            
            // Force redraw
            line.style.display = 'none';
            line.offsetHeight;
            line.style.display = 'block';
        }

        if (DEBUG) {
            console.log('Line update complete:', {
                dotId: dot.getAttribute('data-dot-id'),
                measurements: {
                    length,
                    angle,
                    position: {
                        top: line.style.top,
                        left: line.style.left
                    }
                },
                dimensions: {
                    width: line.offsetWidth,
                    height: line.offsetHeight
                }
            });
        }

    } catch (error) {
        console.error('Error updating connecting line:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dot: dot.getAttribute('data-dot-id'),
            measurements: {
                length,
                angle,
                position: {
                    top: line.style.top,
                    left: line.style.left
                }
            }
        });
    }
}

export function startLabelBoxDrag(dot: HTMLElement, labelBox: HTMLElement, event: MouseEvent) {
    if (!window.tpf) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    // Store original values before drag starts
    const originalOffset = {
        x: parseInt(labelBox.style.left) || LABEL_CONNECTION.DEFAULT_LENGTH,
        y: parseInt(labelBox.style.top) || -LABEL_CONNECTION.DEFAULT_LENGTH
    };
    const originalLength = parseFloat(dot.getAttribute('data-line-length') ?? '0') || LABEL_CONNECTION.DEFAULT_LENGTH;
    
    dot.setAttribute('data-original-offset', JSON.stringify(originalOffset));
    dot.setAttribute('data-original-length', originalLength.toString());
    
    window.tpf.isLabelBoxDragging = true;
    window.tpf.currentLabelBox = labelBox as HTMLDivElement;
    
    const rect = labelBox.getBoundingClientRect();
    window.tpf.labelBoxOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

export function getDotElements(dot: HTMLElement): DotElements {
    return {
        dot: dot.querySelector('.dot') as HTMLElement,
        label: dot.querySelector('.label-container') as HTMLElement,
        line: dot.querySelector('.connecting-line') as HTMLElement,
        coordinates: dot.querySelector('.dot-coordinates') as HTMLElement
    };
}