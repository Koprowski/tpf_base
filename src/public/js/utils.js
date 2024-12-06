var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { DEBUG } from './constants';
import { LABEL_CONNECTION } from './constants';
export function updateConnectingLine(dot) {
    var line = dot.querySelector('.connecting-line');
    var labelContainer = dot.querySelector('.label-container');
    var dotElement = dot.querySelector('.dot');
    if (!line || !labelContainer || !dotElement) {
        if (DEBUG) {
            console.warn('Missing elements:', { line: !!line, label: !!labelContainer, dot: !!dotElement });
        }
        return;
    }
    // Get dimensions before any transforms
    var originalLabelBox = labelContainer.getBoundingClientRect();
    var originalDotBox = dotElement.getBoundingClientRect();
    var containerRect = dot.getBoundingClientRect();
    // Calculate center points
    var dotCenterX = originalDotBox.left - containerRect.left + originalDotBox.width / 2;
    var dotCenterY = originalDotBox.top - containerRect.top + originalDotBox.height / 2;
    var labelCenterX = originalLabelBox.left - containerRect.left;
    var labelCenterY = originalLabelBox.top - containerRect.top + originalLabelBox.height / 2;
    // Connect to left edge of label at vertical center
    var labelLeftX = originalLabelBox.left - containerRect.left;
    var dx = labelLeftX - dotCenterX;
    var dy = labelCenterY - dotCenterY;
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
    var length = Math.sqrt(dx * dx + dy * dy);
    try {
        var baseStyles = {
            position: 'absolute',
            width: "".concat(length, "px"),
            height: '1px',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: "".concat(LABEL_CONNECTION.LINE_WIDTH, "px solid ").concat(LABEL_CONNECTION.LINE_COLOR),
            display: 'block',
            visibility: 'visible',
            zIndex: '1',
            pointerEvents: 'none',
            transform: "rotate(".concat(angle, "deg)")
        };
        var defaultPosition = {
            top: LABEL_CONNECTION.LINE_POSITION.TOP,
            left: LABEL_CONNECTION.LINE_POSITION.LEFT,
        };
        if (!dotElement.hasAttribute('data-line-position')) {
            // First time positioning
            Object.assign(line.style, __assign(__assign({}, baseStyles), defaultPosition));
            dotElement.setAttribute('data-line-position', JSON.stringify(defaultPosition));
            if (DEBUG) {
                console.log('Initial line position set:', {
                    dotId: dot.getAttribute('data-dot-id'),
                    position: defaultPosition
                });
            }
        }
        else {
            // Restore saved position
            var storedPosition = JSON.parse(dotElement.getAttribute('data-line-position') || '{}');
            Object.assign(line.style, __assign(__assign({}, baseStyles), storedPosition));
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
        var finalLineBox = line.getBoundingClientRect();
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
                    length: length,
                    angle: angle,
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
    }
    catch (error) {
        console.error('Error updating connecting line:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dot: dot.getAttribute('data-dot-id'),
            measurements: {
                length: length,
                angle: angle,
                position: {
                    top: line.style.top,
                    left: line.style.left
                }
            }
        });
    }
}
export function startLabelBoxDrag(dot, labelBox, event) {
    var _a;
    if (!window.tpf)
        return;
    event.preventDefault();
    event.stopPropagation();
    // Store original values before drag starts
    var originalOffset = {
        x: parseInt(labelBox.style.left) || LABEL_CONNECTION.DEFAULT_LENGTH,
        y: parseInt(labelBox.style.top) || -LABEL_CONNECTION.DEFAULT_LENGTH
    };
    var originalLength = parseFloat((_a = dot.getAttribute('data-line-length')) !== null && _a !== void 0 ? _a : '0') || LABEL_CONNECTION.DEFAULT_LENGTH;
    dot.setAttribute('data-original-offset', JSON.stringify(originalOffset));
    dot.setAttribute('data-original-length', originalLength.toString());
    window.tpf.isLabelBoxDragging = true;
    window.tpf.currentLabelBox = labelBox;
    var rect = labelBox.getBoundingClientRect();
    window.tpf.labelBoxOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
export function getDotElements(dot) {
    return {
        dot: dot.querySelector('.dot'),
        label: dot.querySelector('.label-container'),
        line: dot.querySelector('.connecting-line'),
        coordinates: dot.querySelector('.dot-coordinates')
    };
}
