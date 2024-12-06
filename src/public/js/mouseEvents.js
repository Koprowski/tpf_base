var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { tpf } from "./data";
import { COORDINATE_STEP, LABEL_CONNECTION } from './constants';
import { coordinateToPixel, pixelToCoordinate, normalizeCoordinate } from './createTickMarks';
import { recordDotState, generateDotId, addToUndoHistory } from "./data";
import { dotsSave } from "./dotsSave";
import log from "./util.log";
import { adjustHoverBox } from './dotsCreate';
import { updateConnectingLine } from './utils';
import { throttle, debounce } from './keyboardUtils';
export function getAbsolutePosition(coordinate, isX) {
    if (isX === void 0) { isX = true; }
    return coordinateToPixel(isX ? coordinate : -coordinate);
}
function autosaveToServer(dots) {
    return __awaiter(this, void 0, void 0, function () {
        var urlParts, urlId, processedDots, response, error_1, urlParts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    urlParts = window.location.pathname.split('/');
                    if (urlParts.length <= 2 || urlParts[1] === '') {
                        // Don't attempt to autosave if we're on homepage/new page
                        return [2 /*return*/];
                    }
                    urlId = urlParts[urlParts.length - 1];
                    processedDots = dots.map(function (dot) { return ({
                        x: parseFloat(dot.x), // Remove 'px' and convert to number
                        y: parseFloat(dot.y), // Remove 'px' and convert to number
                        coordinates: dot.coordinates,
                        label: dot.label
                    }); });
                    return [4 /*yield*/, fetch("/api/pages/".concat(urlId), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                dots: processedDots
                            }),
                            credentials: 'same-origin'
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to auto-save page');
                    }
                    log('Page auto-saved successfully');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    urlParts = window.location.pathname.split('/');
                    if (urlParts.length > 2 && urlParts[1] !== '') {
                        console.error('Error auto-saving page:', error_1);
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getAllDots() {
    return Array.from(document.getElementsByClassName('dot-container')).map(function (dotEl) {
        var labelElement = dotEl.querySelector('.user-dot-label');
        var coordsElement = dotEl.querySelector('.dot-coordinates');
        var dotElement = dotEl;
        return {
            x: dotElement.style.left || '0px',
            y: dotElement.style.top || '0px',
            coordinates: (coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) || '',
            label: (labelElement === null || labelElement === void 0 ? void 0 : labelElement.textContent) || ''
        };
    });
}
document.addEventListener('keydown', function (event) {
    console.log('handleKeyboardMovement triggered');
    handleKeyboardMovement(event);
});
var dotState = {
    originalGridX: 0,
    originalGridY: 0,
    totalDeltaX: 0,
    totalDeltaY: 0,
    currentGridX: 0,
    currentGridY: 0,
};
// Create debounced log function
var debouncedLog = debounce(function (message) {
    log(message, 'keyboard');
}, 100);
// Create throttled movement function for keyboard
var throttledMove = throttle(function (event) {
    if (!tpf.selectedDot)
        return;
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    // Get current position using parseFloat instead of parseInt to preserve decimals
    var currentLeft = parseFloat(tpf.selectedDot.style.left) || 0;
    var currentTop = parseFloat(tpf.selectedDot.style.top) || 0;
    // Convert current pixel position to grid coordinates
    var currentGridX = pixelToCoordinate(currentLeft);
    var currentGridY = -pixelToCoordinate(currentTop);
    // Determine increment based on key combination
    var increment;
    if (event.ctrlKey && event.shiftKey) {
        increment = 0.01;
    }
    else if (event.ctrlKey) {
        increment = 0.25;
    }
    else {
        increment = COORDINATE_STEP; // 0.02
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
    var newLeft = coordinateToPixel(currentGridX);
    var newTop = coordinateToPixel(-currentGridY);
    // Update position
    tpf.selectedDot.style.left = "".concat(newLeft, "px");
    tpf.selectedDot.style.top = "".concat(newTop, "px");
    // Update coordinates text with precise formatting
    var coordsElement = tpf.selectedDot.querySelector('.dot-coordinates');
    if (coordsElement) {
        coordsElement.textContent = "(".concat(currentGridX.toFixed(2), ", ").concat(currentGridY.toFixed(2), ")");
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
var throttledMouseMove = throttle(function (event) {
    // Skip if we're not actually dragging
    if (!tpf.isDragging || !tpf.currentDot || tpf.currentDot.classList.contains('editing'))
        return;
    event.preventDefault();
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    var rect = xyPlane.getBoundingClientRect();
    var newLeft = event.clientX - rect.left;
    var newTop = event.clientY - rect.top;
    if (isWithinBounds(newLeft, newTop, rect)) {
        var x = pixelToCoordinate(newLeft);
        var y = -pixelToCoordinate(newTop);
        var normalizedX = normalizeCoordinate(x);
        var normalizedY = normalizeCoordinate(y);
        var finalLeft = coordinateToPixel(normalizedX);
        var finalTop = coordinateToPixel(-normalizedY);
        // Update position
        tpf.currentDot.style.left = "".concat(finalLeft, "px");
        tpf.currentDot.style.top = "".concat(finalTop, "px");
        tpf.currentDot.style.transform = 'translate(-50%, -50%)';
        // Update coordinates text
        var coordsElement = tpf.currentDot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = "(".concat(normalizedX.toFixed(2), ", ").concat(normalizedY.toFixed(2), ")");
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
function handleKeyboardMovement(event) {
    var isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);
    if (!isArrowKey || !tpf.selectedDot) {
        return;
    }
    event.preventDefault();
    throttledMove(event);
}
function mouseDown(event) {
    log('mouseDown');
    var target = event.target;
    var dotContainer = findDotContainer(target);
    if (dotContainer && !dotContainer.classList.contains('editing') && !document.querySelector('.label-input:focus')) {
        event.preventDefault();
        tpf.isDragging = true;
        tpf.currentDot = dotContainer;
        var rect = dotContainer.getBoundingClientRect();
        tpf.offsetX = event.clientX - rect.left;
        tpf.offsetY = event.clientY - rect.top;
    }
    else if (target.classList.contains('label-input')) {
        var dotContainers = document.querySelectorAll('.dot-container.selected');
        dotContainers.forEach(function (container) { return container.classList.remove('selected'); });
    }
}
function handleLabelBoxDrag(event) {
    if (!tpf.currentLabelBox)
        return;
    var dotContainer = findDotContainer(tpf.currentLabelBox);
    if (!dotContainer)
        return;
    var dotRect = dotContainer.getBoundingClientRect();
    var newX = event.clientX - dotRect.left - tpf.labelBoxOffset.x;
    var newY = event.clientY - dotRect.top - tpf.labelBoxOffset.y;
    var dx = newX;
    var dy = newY;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= LABEL_CONNECTION.MIN_LINE_LENGTH &&
        distance <= LABEL_CONNECTION.MAX_LINE_LENGTH) {
        tpf.currentLabelBox.style.left = "".concat(newX, "px");
        tpf.currentLabelBox.style.top = "".concat(newY, "px");
        updateConnectingLine(dotContainer);
        dotContainer.setAttribute('data-line-length', distance.toString());
    }
}
function mouseMove(event) {
    // Handle label box dragging separately and without throttling
    if (tpf.isLabelBoxDragging && tpf.currentLabelBox) {
        handleLabelBoxDrag(event);
        return;
    }
    throttledMouseMove(event);
}
function mouseUp(event) {
    log('mouseUp');
    if (tpf.isDragging && tpf.currentDot) {
        tpf.isDragging = false;
        var previousState = recordDotState(tpf.currentDot);
        // Ensure the dot has a unique ID
        if (!tpf.currentDot.getAttribute('data-dot-id')) {
            tpf.currentDot.setAttribute('data-dot-id', generateDotId());
        }
        // Add to undo history
        addToUndoHistory({
            type: 'move',
            dotId: tpf.currentDot.getAttribute('data-dot-id'),
            previousState: previousState,
            newState: recordDotState(tpf.currentDot)
        });
        // Get all current dots and save only after drag is complete
        var dots = getAllDots();
        dotsSave(dots).catch(function (error) {
            console.error('Error saving dots:', error);
        });
        // Dispatch change event
        var moveEvent = new CustomEvent('dotChanged', { bubbles: true });
        tpf.currentDot.dispatchEvent(moveEvent);
        tpf.currentDot = null;
        tpf.skipGraphClick = true;
        setTimeout(function () {
            tpf.skipGraphClick = false;
        }, 0);
    }
}
function findDotContainer(element) {
    if (!element)
        return null;
    if (element.classList.contains('dot-container')) {
        return element;
    }
    if (element.parentElement) {
        return findDotContainer(element.parentElement);
    }
    return null;
}
function isWithinBounds(x, y, rect) {
    return x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
}
export function updateDotCoordinates(dot) {
    var coordsElement = dot.querySelector('.dot-coordinates');
    if (!coordsElement)
        return;
    // Use the stored coordinate values instead of recalculating
    var storedCoords = dot.getAttribute('data-original-coords');
    if (storedCoords) {
        coordsElement.textContent = storedCoords;
    }
}
function autosaveDots() {
    var dots = getAllDots();
    autosaveToServer(dots);
}
export function startLabelBoxDrag(dot, labelBox, event) {
    event.preventDefault();
    event.stopPropagation();
    tpf.isLabelBoxDragging = true;
    tpf.currentLabelBox = labelBox;
    var rect = labelBox.getBoundingClientRect();
    tpf.labelBoxOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
    // Store original state for undo
    var previousState = recordDotState(dot);
    // Update mouseMove to handle label box dragging
    var originalMouseMove = window.onmousemove;
    var originalMouseUp = window.onmouseup;
    window.onmousemove = function (e) {
        if (!tpf.isLabelBoxDragging || !tpf.currentLabelBox)
            return;
        var dotRect = dot.getBoundingClientRect();
        var newX = e.clientX - dotRect.left - tpf.labelBoxOffset.x;
        var newY = e.clientY - dotRect.top - tpf.labelBoxOffset.y;
        // Calculate distance from dot center
        var dx = newX;
        var dy = newY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        // Enforce minimum and maximum line length
        if (distance >= LABEL_CONNECTION.MIN_LINE_LENGTH &&
            distance <= LABEL_CONNECTION.MAX_LINE_LENGTH) {
            tpf.currentLabelBox.style.left = "".concat(newX, "px");
            tpf.currentLabelBox.style.top = "".concat(newY, "px");
            // Update connecting line
            updateConnectingLine(dot);
            // Store the new line length
            dot.setAttribute('data-line-length', distance.toString());
        }
    };
    window.onmouseup = function () {
        if (tpf.isLabelBoxDragging && tpf.currentLabelBox) {
            // Add to undo history
            addToUndoHistory({
                type: 'labelMove',
                dotId: dot.getAttribute('data-dot-id'),
                previousState: previousState,
                newState: recordDotState(dot)
            });
            // Save the new state
            var dots = getAllDots();
            dotsSave(dots).catch(console.error);
        }
        // Reset dragging state
        tpf.isLabelBoxDragging = false;
        tpf.currentLabelBox = null;
        window.onmousemove = originalMouseMove;
        window.onmouseup = originalMouseUp;
    };
}
export { tpf, mouseMove, mouseUp, mouseDown, adjustHoverBox, autosaveDots, debounce, throttle, handleKeyboardMovement };
