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
import { adjustHoverBox, adjustSelectedBox } from './dotsCreate';
import { updateConnectingLine } from './utils';
import { throttle, debounce } from './keyboardUtils';
function ensureHTMLElement(element) {
    if (element instanceof HTMLElement) {
        return element;
    }
    // Fallback: create a new HTMLElement if conversion fails
    var htmlElement = document.createElement('div');
    htmlElement.innerHTML = element.innerHTML;
    return htmlElement;
}
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
    // Handle Escape key
    if (event.key === 'Escape') {
        var selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        selectedDots.forEach(function (dot) {
            dot.classList.remove('selected');
            dot.classList.remove('multi-selected');
            adjustHoverBox(dot);
            adjustSelectedBox(dot);
        });
        tpf.selectedDot = null;
        return;
    }
    // Handle movement keys
    handleKeyboardMovement(event);
    // Handle delete key
    handleKeyboardDelete(event);
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
    // Get all currently selected dots
    var selectedDots = document.querySelectorAll('.dot-container.selected');
    if (selectedDots.length === 0)
        return;
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    // Determine increment based on key combination
    var increment;
    if (event.ctrlKey && event.shiftKey) {
        increment = 0.01;
    }
    else if (event.ctrlKey) {
        increment = 0.5;
    }
    else {
        increment = COORDINATE_STEP;
    }
    // Move all selected dots
    selectedDots.forEach(function (selectedDot) {
        var dot = selectedDot;
        // Get current position using parseFloat instead of parseInt to preserve decimals
        var currentLeft = parseFloat(dot.style.left) || 0;
        var currentTop = parseFloat(dot.style.top) || 0;
        // Convert current pixel position to grid coordinates
        var currentGridX = pixelToCoordinate(currentLeft);
        var currentGridY = -pixelToCoordinate(currentTop);
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
        dot.style.left = "".concat(newLeft, "px");
        dot.style.top = "".concat(newTop, "px");
        // Update coordinates text with precise formatting
        var coordsElement = dot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = "(".concat(currentGridX.toFixed(1), ", ").concat(currentGridY.toFixed(1), ")");
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
var throttledMouseMove = throttle(function (event) {
    var _a, _b, _c;
    // Skip if we're not actually dragging
    if (!tpf.isDragging || ((_a = tpf.currentDot) === null || _a === void 0 ? void 0 : _a.classList.contains('editing')))
        return;
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    var rect = xyPlane.getBoundingClientRect();
    var newLeft = event.clientX - rect.left;
    var newTop = event.clientY - rect.top;
    // Check for multi-dot selection
    var multiSelectedDots = document.querySelectorAll('.dot-container.multi-selected');
    // Function to move a single dot and update its properties
    var moveDot = function (dot, deltaX, deltaY) {
        // Get current position with explicit fallback
        var currentLeft = parseFloat(dot.style.left || '0');
        var currentTop = parseFloat(dot.style.top || '0');
        // Calculate new position
        var finalLeft = currentLeft + deltaX;
        var finalTop = currentTop + deltaY;
        // Convert to grid coordinates
        var x = pixelToCoordinate(finalLeft);
        var y = -pixelToCoordinate(finalTop);
        // Normalize coordinates
        var normalizedX = Math.max(-5, Math.min(5, x));
        var normalizedY = Math.max(-5, Math.min(5, y));
        // Convert back to pixels
        var finalPixelLeft = coordinateToPixel(normalizedX);
        var finalPixelTop = coordinateToPixel(-normalizedY);
        // Update dot position
        dot.style.left = "".concat(finalPixelLeft, "px");
        dot.style.top = "".concat(finalPixelTop, "px");
        // Update coordinates text
        var coordsElement = dot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = "(".concat(normalizedX.toFixed(1), ", ").concat(normalizedY.toFixed(1), ")");
        }
        // Update connecting line
        updateConnectingLine(dot);
        // Adjust hover box if needed
        if (dot.classList.contains('selected')) {
            // Type assertion to handle hover box function
            adjustHoverBox(dot);
        }
    };
    // If multiple dots are selected, move them together
    if (multiSelectedDots.length > 0) {
        // Safe parsing with explicit fallback
        var currentDotLeft = ((_b = tpf.currentDot) === null || _b === void 0 ? void 0 : _b.style.left) || '0';
        var currentDotTop = ((_c = tpf.currentDot) === null || _c === void 0 ? void 0 : _c.style.top) || '0';
        // Calculate movement delta
        var deltaX_1 = newLeft - parseFloat(currentDotLeft);
        var deltaY_1 = newTop - parseFloat(currentDotTop);
        multiSelectedDots.forEach(function (dot) {
            moveDot(dot, deltaX_1, deltaY_1);
        });
    }
    // Otherwise, move the single current dot
    else if (tpf.currentDot && isWithinBounds(newLeft, newTop, rect)) {
        var x = pixelToCoordinate(newLeft);
        var y = -pixelToCoordinate(newTop);
        var normalizedX = normalizeCoordinate(x);
        var normalizedY = normalizeCoordinate(y);
        var finalLeft = coordinateToPixel(normalizedX);
        var finalTop = coordinateToPixel(-normalizedY);
        // Update position
        tpf.currentDot.style.left = "".concat(finalLeft, "px");
        tpf.currentDot.style.top = "".concat(finalTop, "px");
        // Update coordinates text
        var coordsElement = tpf.currentDot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = "(".concat(normalizedX.toFixed(1), ", ").concat(normalizedY.toFixed(1), ")");
        }
        // Update line position
        updateConnectingLine(tpf.currentDot);
        // Update hover box if needed
        if (tpf.currentDot.classList.contains('selected')) {
            // Type assertion to handle hover box function
            adjustHoverBox(tpf.currentDot);
        }
    }
}, 16); // 16ms is roughly 60 FPS
// Main keyboard handler
function handleKeyboardMovement(event) {
    var isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);
    // Get all selected dots, including both single and multi-selected
    var selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
    if (!isArrowKey || selectedDots.length === 0) {
        return;
    }
    event.preventDefault();
    // Determine increment based on key combination
    var increment;
    if (event.ctrlKey && event.shiftKey) {
        increment = 0.01;
    }
    else if (event.ctrlKey) {
        increment = 0.5;
    }
    else {
        increment = COORDINATE_STEP;
    }
    // Move all selected dots
    selectedDots.forEach(function (selectedDot) {
        var dot = selectedDot;
        // Get current position using parseFloat to preserve decimals
        var currentLeft = parseFloat(dot.style.left) || 0;
        var currentTop = parseFloat(dot.style.top) || 0;
        // Convert current pixel position to grid coordinates
        var currentGridX = pixelToCoordinate(currentLeft);
        var currentGridY = -pixelToCoordinate(currentTop);
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
        dot.style.left = "".concat(newLeft, "px");
        dot.style.top = "".concat(newTop, "px");
        // Update coordinates text with precise formatting
        var coordsElement = dot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = "(".concat(currentGridX.toFixed(1), ", ").concat(currentGridY.toFixed(1), ")");
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
    var urlParts = window.location.pathname.split('/');
    if (urlParts.length > 2 && urlParts[1] !== '') {
        autosaveDots();
    }
}
function handleKeyboardDelete(event) {
    // Only handle delete key
    if (event.key !== 'Delete')
        return;
    // Get all multi-selected dots
    var dotsToDelete = document.querySelectorAll('.dot-container.multi-selected, .dot-container.selected');
    if (dotsToDelete.length === 0)
        return;
    // Process all selected dots
    dotsToDelete.forEach(function (dotElement) {
        var dotId = dotElement.getAttribute('data-dot-id');
        if (dotId) {
            var previousState = recordDotState(dotElement);
            dotElement.remove();
            addToUndoHistory({
                type: 'delete',
                dotId: dotId,
                previousState: previousState,
                newState: undefined
            });
        }
    });
    // Clear selection tracking
    tpf.selectedDot = null;
    // Trigger autosave if not on homepage
    var urlParts = window.location.pathname.split('/');
    if (urlParts.length > 2 && urlParts[1] !== '') {
        autosaveDots();
    }
}
function mouseDown(event) {
    var _a;
    log('mouseDown');
    var target = event.target;
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    console.log('MouseDown event:', {
        target: event.target,
        targetType: event.target.className,
        isXYPlane: event.target === xyPlane
    });
    console.log('Selection state:', {
        selectedCount: document.querySelectorAll('.dot-container.selected').length,
        multiSelectedCount: document.querySelectorAll('.dot-container.multi-selected').length,
        isShiftPressed: event.shiftKey,
        isDragging: tpf.isDragging,
        isSelecting: isSelecting,
        currentDot: ((_a = tpf.currentDot) === null || _a === void 0 ? void 0 : _a.getAttribute('data-dot-id')) || null
    });
    // Get any currently selected dots
    var selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
    var hasSelectedDots = selectedDots.length > 0;
    // If clicking on xy-plane and dots are selected, handle deselection first
    if (target === xyPlane && (hasSelectedDots || tpf.selectedDot)) {
        console.log('=== Deselecting dots ===');
        // Stop all event handling first
        event.stopImmediatePropagation(); // This prevents all other handlers from firing
        event.preventDefault();
        event.stopPropagation();
        // Deselect all dots
        selectedDots.forEach(function (dot) {
            dot.classList.remove('selected');
            dot.classList.remove('multi-selected');
            adjustHoverBox(dot);
            adjustSelectedBox(dot);
        });
        tpf.selectedDot = null;
        tpf.isDragging = false;
        tpf.currentDot = null;
        tpf.skipGraphClick = true;
        // Set a timeout to reset skipGraphClick
        setTimeout(function () {
            tpf.skipGraphClick = false;
        }, 0);
        return;
    }
    // Check if we clicked a dot or part of a dot container
    var dotContainer = findDotContainer(target);
    var isShiftKeyPressed = event.shiftKey;
    // Handle dot container clicks
    if (dotContainer && !dotContainer.classList.contains('editing') && !document.querySelector('.label-input:focus')) {
        event.preventDefault();
        event.stopPropagation();
        // If shift key is not pressed, handle single selection
        if (!isShiftKeyPressed) {
            // Clear other selections
            var previouslySelected = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
            previouslySelected.forEach(function (d) {
                if (d !== dotContainer) {
                    d.classList.remove('selected');
                    d.classList.remove('multi-selected');
                    adjustHoverBox(d);
                    adjustSelectedBox(d);
                }
            });
            // Toggle selection on clicked dot
            var isCurrentlySelected = dotContainer.classList.contains('selected') ||
                dotContainer.classList.contains('multi-selected');
            if (isCurrentlySelected) {
                dotContainer.classList.remove('selected');
                dotContainer.classList.remove('multi-selected');
                tpf.selectedDot = null;
            }
            else {
                dotContainer.classList.add('selected');
                dotContainer.classList.remove('multi-selected');
                tpf.selectedDot = dotContainer;
            }
        }
        else {
            // Shift key is pressed - handle multi-selection
            console.log('Multi-select triggered:', {
                existingSelections: document.querySelectorAll('.dot-container.multi-selected').length,
                shiftKey: event.shiftKey,
                targetIsDot: !!findDotContainer(event.target)
            });
            var wasSelected = dotContainer.classList.contains('selected') ||
                dotContainer.classList.contains('multi-selected');
            if (wasSelected) {
                dotContainer.classList.remove('selected');
                dotContainer.classList.remove('multi-selected');
            }
            else {
                dotContainer.classList.add('multi-selected');
                dotContainer.classList.remove('selected');
                tpf.selectedDot = dotContainer;
            }
            // Convert any single selections to multi-selections if we have multiple dots
            var selectedDots_1 = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
            if (selectedDots_1.length > 1) {
                selectedDots_1.forEach(function (dot) {
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
        var rect = dotContainer.getBoundingClientRect();
        tpf.offsetX = event.clientX - rect.left;
        tpf.offsetY = event.clientY - rect.top;
        return;
    }
    // Handle xy-plane clicks (including multi-select)
    if (target === xyPlane) {
        if (!isShiftKeyPressed) {
            // Clear selections on plain click
            var selectedDots_2 = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
            selectedDots_2.forEach(function (container) {
                container.classList.remove('selected');
                container.classList.remove('multi-selected');
                adjustHoverBox(container);
                adjustSelectedBox(container);
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
    var _a, _b, _c;
    // Handle label box dragging separately and without throttling
    if (tpf.isLabelBoxDragging && tpf.currentLabelBox) {
        handleLabelBoxDrag(event);
        return;
    }
    // Skip early if not doing anything
    if (!tpf.isDragging || ((_a = tpf.currentDot) === null || _a === void 0 ? void 0 : _a.classList.contains('editing'))) {
        return;
    }
    // Only log when actually dragging dots
    if (tpf.isDragging && tpf.currentDot) {
        console.log('Moving dot(s):', {
            selectedDots: document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length,
            isDragging: true
        });
    }
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    var rect = xyPlane.getBoundingClientRect();
    var newLeft = event.clientX - rect.left;
    var newTop = event.clientY - rect.top;
    // Get all selected dots
    var selectedDots = document.querySelectorAll('.dot-container.selected');
    // If we have multiple selected dots
    if (selectedDots.length > 1) {
        // Calculate movement delta based on current dot
        var currentLeft = parseFloat(((_b = tpf.currentDot) === null || _b === void 0 ? void 0 : _b.style.left) || '0');
        var currentTop = parseFloat(((_c = tpf.currentDot) === null || _c === void 0 ? void 0 : _c.style.top) || '0');
        var deltaX_2 = newLeft - currentLeft;
        var deltaY_2 = newTop - currentTop;
        // Move all selected dots by the same delta
        selectedDots.forEach(function (dot) {
            var dotEl = dot;
            var originalLeft = parseFloat(dotEl.style.left || '0');
            var originalTop = parseFloat(dotEl.style.top || '0');
            var finalLeft = originalLeft + deltaX_2;
            var finalTop = originalTop + deltaY_2;
            // Convert to grid coordinates
            var x = pixelToCoordinate(finalLeft);
            var y = -pixelToCoordinate(finalTop);
            // Normalize coordinates
            var normalizedX = Math.max(-5, Math.min(5, x));
            var normalizedY = Math.max(-5, Math.min(5, y));
            // Convert back to pixels
            var finalPixelLeft = coordinateToPixel(normalizedX);
            var finalPixelTop = coordinateToPixel(-normalizedY);
            // Update position
            dotEl.style.left = "".concat(finalPixelLeft, "px");
            dotEl.style.top = "".concat(finalPixelTop, "px");
            // Update coordinates display
            var coordsElement = dotEl.querySelector('.dot-coordinates');
            if (coordsElement) {
                coordsElement.textContent = "(".concat(normalizedX.toFixed(1), ", ").concat(normalizedY.toFixed(1), ")");
            }
            updateConnectingLine(dotEl);
            if (dotEl.classList.contains('selected')) {
                adjustHoverBox(dotEl);
            }
        });
    }
    // Single dot movement
    else if (tpf.currentDot && isWithinBounds(newLeft, newTop, rect)) {
        var x = pixelToCoordinate(newLeft);
        var y = -pixelToCoordinate(newTop);
        var normalizedX = normalizeCoordinate(x);
        var normalizedY = normalizeCoordinate(y);
        var finalLeft = coordinateToPixel(normalizedX);
        var finalTop = coordinateToPixel(-normalizedY);
        tpf.currentDot.style.left = "".concat(finalLeft, "px");
        tpf.currentDot.style.top = "".concat(finalTop, "px");
        var coordsElement = tpf.currentDot.querySelector('.dot-coordinates');
        if (coordsElement) {
            coordsElement.textContent = "(".concat(normalizedX.toFixed(1), ", ").concat(normalizedY.toFixed(1), ")");
        }
        updateConnectingLine(tpf.currentDot);
        if (tpf.currentDot.classList.contains('selected')) {
            adjustHoverBox(tpf.currentDot);
        }
    }
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
// SELECT and MOVE MULTIPLE DOTS START//
var isSelecting = false;
var selectionStart = null;
var selectionRectangle = null;
function createSelectionRectangle() {
    var rectangle = document.createElement('div');
    rectangle.classList.add('selection-rectangle');
    rectangle.style.position = 'absolute';
    rectangle.style.border = '1px solid blue';
    rectangle.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
    rectangle.style.pointerEvents = 'none';
    return rectangle;
}
function handleMultiDotSelection(event) {
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    // Prevent default to stop dot creation
    event.preventDefault();
    event.stopPropagation();
    // Only start selection if clicking on empty graph space
    if (event.target !== xyPlane)
        return;
    // Clean up any existing selection rectangles first
    var existingRectangles = document.querySelectorAll('.selection-rectangle');
    existingRectangles.forEach(function (rect) { return rect.remove(); });
    // Clear previous selections if not using shift key
    if (!event.shiftKey) {
        var previouslySelected = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        previouslySelected.forEach(function (dot) {
            dot.classList.remove('selected');
            dot.classList.remove('multi-selected');
            adjustHoverBox(dot);
            adjustSelectedBox(dot);
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
    var cleanup = function () {
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
    var onEscape = function (e) {
        if (e.key === 'Escape') {
            cleanup();
        }
    };
    var onMouseMove = function (moveEvent) {
        if (!isSelecting || !selectionStart || !selectionRectangle || !xyPlane)
            return;
        // Calculate positions relative to page
        var xyPlaneRect = xyPlane.getBoundingClientRect();
        var currentX = moveEvent.clientX;
        var currentY = moveEvent.clientY;
        var startX = xyPlaneRect.left + selectionStart.x;
        var startY = xyPlaneRect.top + selectionStart.y;
        // Update rectangle dimensions
        var width = Math.abs(currentX - startX);
        var height = Math.abs(currentY - startY);
        var left = Math.min(currentX, startX);
        var top = Math.min(currentY, startY);
        Object.assign(selectionRectangle.style, {
            position: 'fixed',
            width: "".concat(width, "px"),
            height: "".concat(height, "px"),
            left: "".concat(left, "px"),
            top: "".concat(top, "px"),
            display: 'block',
            zIndex: '1000'
        });
        // Update selected dots
        var dots = document.querySelectorAll('.dot-container');
        var selectedDots = new Set();
        dots.forEach(function (dot) {
            var dotRect = dot.getBoundingClientRect();
            var dotBox = {
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
        dots.forEach(function (dot) {
            if (selectedDots.has(dot)) {
                // Always use multi-selected for drag box selection
                dot.classList.remove('selected');
                dot.classList.add('multi-selected');
            }
            else if (!moveEvent.shiftKey) {
                // Clear selection for unselected dots
                dot.classList.remove('selected');
                dot.classList.remove('multi-selected');
            }
            adjustHoverBox(dot);
            adjustSelectedBox(dot);
        });
    };
    var onMouseUp = function () {
        if (!isSelecting)
            return;
        // Update selection states one final time
        var selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        var dotsArray = Array.from(selectedDots);
        if (dotsArray.length > 0) {
            // Always keep dots in multi-selected state when using drag box
            dotsArray.forEach(function (dot) {
                dot.classList.remove('selected');
                dot.classList.add('multi-selected');
                adjustHoverBox(dot);
                adjustSelectedBox(dot);
            });
            // Update tpf.selectedDot
            tpf.selectedDot = dotsArray[dotsArray.length - 1];
        }
        cleanup();
    };
    // Add event listeners to window
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onEscape);
}
function highlightSelectedDots(left, top, width, height) {
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    var dotContainers = document.querySelectorAll('.dot-container');
    var selectedDotsCount = 0;
    dotContainers.forEach(function (dot) {
        try {
            // Convert to HTMLElement safely using our utility function
            var dotElement = ensureHTMLElement(dot);
            var dotRect = dotElement.getBoundingClientRect();
            var xyPlaneRect = xyPlane.getBoundingClientRect();
            var dotLeft = dotRect.left - xyPlaneRect.left;
            var dotTop = dotRect.top - xyPlaneRect.top;
            var dotRight = dotLeft + dotRect.width;
            var dotBottom = dotTop + dotRect.height;
            var isInSelection = dotLeft >= left &&
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
        }
        catch (error) {
            console.error('Error processing dot element:', error);
        }
    });
    // Update the currently selected dot to the last selected dot
    var selectedDots = document.querySelectorAll('.dot-container.selected');
    if (selectedDots.length > 0) {
        try {
            // Convert last selected dot to HTMLElement safely
            var lastSelectedDot = ensureHTMLElement(selectedDots[selectedDots.length - 1]);
            tpf.selectedDot = lastSelectedDot;
        }
        catch (error) {
            console.error('Error setting selected dot:', error);
        }
    }
    console.log("Dots selected: ".concat(selectedDotsCount));
}
// SELECT and MOVE MULTIPLE DOTS END //
export { tpf, mouseMove, mouseUp, mouseDown, adjustHoverBox, autosaveDots, debounce, throttle, handleKeyboardMovement, handleKeyboardDelete, isSelecting };
