import log from "./util.log";
import { LABEL_CONNECTION } from './constants';
import { SavedDot, Dot} from './types';


interface ValidatedDot {
    x: string;
    y: string;
    coordinates: string;
    label: string;
    labelOffset?: {
        x: number;
        y: number;
    };
    lineLength?: number;
    lineAngle?: number; 
}

function collectDots(): Array<Dot> {
    const dots: Array<Dot> = [];
    const dotContainers = document.querySelectorAll('.dot-container');
    
    log('Found dot containers');
    console.log('Found dot containers:', dotContainers.length);
    console.log('Starting dot collection process');

    dotContainers.forEach((container: Element) => {
        try {
            const dotEl = container as HTMLElement;
            const labelEl = dotEl.querySelector('.user-dot-label');
            const coordsEl = dotEl.querySelector('.dot-coordinates');
            const labelContainer = dotEl.querySelector('.label-container') as HTMLElement;
            const line = dotEl.querySelector('.connecting-line') as HTMLElement;
            
            console.log('Collecting dot state:', {
                id: dotEl.getAttribute('data-dot-id'),
                position: {
                    left: dotEl.style.left,
                    top: dotEl.style.top
                },
                elements: {
                    labelContainer: !!labelContainer,
                    line: !!line,
                    coordsEl: !!coordsEl
                }
            });
            
            const computedStyle = window.getComputedStyle(dotEl);
            const left = dotEl.style.left || computedStyle.left;
            const top = dotEl.style.top || computedStyle.top;
            
            if (!left || !top || left === 'auto' || top === 'auto') {
                console.warn('Invalid position for dot:', { left, top });
                return;
            }
            
            console.log('Processing label container:', {
                exists: !!labelContainer,
                element: labelContainer,
                parentNode: labelContainer?.parentNode
            });

            const defaultLabelOffset = {
                x: LABEL_CONNECTION.DEFAULT_LENGTH as number,
                y: -(LABEL_CONNECTION.DEFAULT_LENGTH as number) / Math.sqrt(2)
            };
            
            let labelOffset = { ...defaultLabelOffset };
            let lineAngle: number = -45;
            
            if (labelContainer && line) {
                const leftValue = parseFloat(labelContainer.style.left);
                const topValue = parseFloat(labelContainer.style.top);
                
                if (!isNaN(leftValue)) {
                    labelOffset.x = leftValue;
                    console.log('Valid left offset:', leftValue);
                } else {
                    console.warn('Invalid left offset, using default:', LABEL_CONNECTION.DEFAULT_LENGTH);
                }
                
                if (!isNaN(topValue)) {
                    labelOffset.y = topValue;
                    console.log('Valid top offset:', topValue);
                } else {
                    console.warn('Invalid top offset, using default:', -LABEL_CONNECTION.DEFAULT_LENGTH / Math.sqrt(2));
                }

                const transform = line.style.transform;
                const angleMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
                if (angleMatch) {
                    const parsedAngle = parseFloat(angleMatch[1]);
                    if (!isNaN(parsedAngle)) {
                        lineAngle = parsedAngle;
                        console.log('Extracted line angle:', lineAngle);
                    }
                } else {
                    console.warn('Could not extract line angle, using default:', lineAngle);
                }
            }

            console.log('Label container position details:', {
                element: labelContainer,
                leftStyle: labelContainer?.style.left,
                topStyle: labelContainer?.style.top,
                computedOffset: labelOffset,
                rawLeft: labelContainer?.style.left,
                rawTop: labelContainer?.style.top,
                lineAngle
            });

            let lineLength = parseFloat(dotEl.getAttribute('data-line-length') || '');
            if (isNaN(lineLength)) {
                lineLength = Math.sqrt(labelOffset.x * labelOffset.x + labelOffset.y * labelOffset.y);
                console.log('Calculated line length from offset:', lineLength);
            } else {
                console.log('Using stored line length:', lineLength);
            }
            
            console.log('Line length calculation details:', {
                dataAttribute: dotEl.getAttribute('data-line-length'),
                calculated: Math.sqrt(labelOffset.x * labelOffset.x + labelOffset.y * labelOffset.y),
                final: lineLength,
                isValid: !isNaN(lineLength),
                angle: lineAngle,
                transform: line?.style.transform
            });

            const dotData: Dot = {
                x: left,
                y: top,
                coordinates: coordsEl?.textContent || '',
                label: labelEl?.textContent || 'null',
                labelOffset,
                lineLength,
                lineAngle
            };

            const validationIssues: string[] = [];
            if (!dotData.coordinates) validationIssues.push('missing coordinates');
            if (!dotData.x) validationIssues.push('missing x position');
            if (!dotData.y) validationIssues.push('missing y position');
            if (dotData.lineLength !== undefined && isNaN(dotData.lineLength)) {
                validationIssues.push('invalid line length');
            }
            if (dotData.lineAngle !== undefined && isNaN(dotData.lineAngle)) {
                validationIssues.push('invalid line angle');
            }
            if (!labelOffset || isNaN(labelOffset.x) || isNaN(labelOffset.y)) {
                validationIssues.push('invalid label offset');
            }

            if (validationIssues.length > 0) {
                console.warn('Dot validation issues:', {
                    dot: dotData,
                    issues: validationIssues,
                    rawValues: {
                        labelOffset,
                        lineLength,
                        lineAngle,
                        transform: line?.style.transform
                    }
                });
            }

            console.log('Complete dot data for saving:', {
                dotData,
                validationIssues,
                isValid: validationIssues.length === 0,
                elementDetails: {
                    hasLabel: !!labelEl,
                    hasCoords: !!coordsEl,
                    hasContainer: !!labelContainer,
                    hasLine: !!line
                },
                styles: {
                    transform: line?.style.transform,
                    labelLeft: labelContainer?.style.left,
                    labelTop: labelContainer?.style.top
                }
            });

            dots.push(dotData);

        } catch (error) {
            console.error('Error processing dot container:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    type: error.name,
                    container: container,
                    containerHTML: container.innerHTML
                });
            }
        }
    });

    console.log('Collection complete:', {
        totalDots: dots.length,
        dotsWithLabels: dots.filter(d => d.label !== 'null').length,
        dotsWithOffsets: dots.filter(d => d.labelOffset !== undefined).length,
        dotsWithAngles: dots.filter(d => d.lineAngle !== undefined).length,
        validDots: dots.filter(d => d.labelOffset && !isNaN(d.labelOffset.x) && !isNaN(d.labelOffset.y)).length
    });
    
    log('Collection complete');
    
    return dots;
}

export async function dotsSave(dots: Dot[]) {
    log('Saving dots', 'dots');
    
    try {
        const urlParts = window.location.pathname.split('/');
        if (urlParts.length <= 2 || urlParts[1] === '') {
            log('Skipping save - on homepage', 'dots');
            return;
        }

        const urlId = urlParts[urlParts.length - 1];
        const dotsToSave = dots.length === 0 ? collectDots() : dots;
        
        log('Pre-save state:', 'dots', JSON.stringify(dotsToSave, null, 2));

        if (dotsToSave.length === 0) {
            log('No dots to save', 'dots');
            return;
        }

        // Format dots to match server expectations
        const processedDots = dotsToSave.map(dot => {
            // Remove 'px' suffix and convert to numbers
            const x = dot.x ? parseFloat(dot.x.replace('px', '')) : 0;
            const y = dot.y ? parseFloat(dot.y.replace('px', '')) : 0;

            // Extract grid coordinates for validation
            const coordMatch = dot.coordinates.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
            const gridX = coordMatch ? parseFloat(coordMatch[1]) : 0;
            const gridY = coordMatch ? parseFloat(coordMatch[2]) : 0;

            if (isNaN(x) || isNaN(y) || isNaN(gridX) || isNaN(gridY)) {
                log('Invalid coordinate values:', 'dots', {
                    x, y, gridX, gridY,
                    raw: { x: dot.x, y: dot.y, coordinates: dot.coordinates }
                });
            }

            // Default label offset if not provided
            const labelOffset = {
                x: dot.labelOffset?.x || LABEL_CONNECTION.DEFAULT_LENGTH,
                y: dot.labelOffset?.y || -LABEL_CONNECTION.DEFAULT_LENGTH
            };

            // Validate line length
            let lineLength = dot.lineLength;
            if (!lineLength || isNaN(lineLength)) {
                lineLength = Math.sqrt(
                    Math.pow(labelOffset.x, 2) + 
                    Math.pow(labelOffset.y, 2)
                );
                log('Calculated missing line length:', 'dots', lineLength);
            }

            // Log validation details
            log('Processing dot:', 'dots', {
                originalState: dot,
                processedValues: {
                    x, y,
                    gridCoords: { x: gridX, y: gridY },
                    labelOffset,
                    lineLength
                }
            });

            return {
                x: String(x),
                y: String(y),
                coordinates: dot.coordinates,
                label: dot.label || '',
                labelOffset,
                lineLength
            };
        });

        log('Sending dots to API:', 'dots', JSON.stringify(processedDots));
        log('Pre-save state:', 'dots', JSON.stringify(processedDots, null, 2));

        const response = await fetch(`/api/pages/${urlId}/dots`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dots: processedDots }),
            credentials: 'same-origin'
        });

        if (!response.ok) {
            const errorText = await response.text();
            log('Server error details:', 'dots', {
                status: response.status,
                statusText: response.statusText,
                responseBody: errorText,
                sentData: processedDots
            });
            throw new Error(`Failed to save dots: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        log('Save successful:', 'dots', JSON.stringify(result, null, 2));

        return result;

    } catch (error) {
        log('Save error:', 'dots', error);
        if (error instanceof Error) {
            log('Error details:', 'dots', {
                message: error.message,
                stack: error.stack,
                type: error.name
            });
        }
        throw error;
    }
}

export async function autosaveDots() {
    try {
        const dots = collectDots();
        await dotsSave(dots);
    } catch (error) {
        console.error('Error in autosave:', error);
    }
}

export function getCurrentDots(): Dot[] {
    return collectDots();
}