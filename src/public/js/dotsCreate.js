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
import { removeAnyExistingElementsWithClassName } from "./removeAnyExistingElementsWithClassName";
import log from "./util.log";
import { mouseDown, mouseUp, mouseMove, isSelecting } from "./mouseEvents";
import { dotsSave, autosaveDots } from "./dotsSave";
import { pixelToCoordinate, coordinateToPixel } from "./createTickMarks";
import { DOT_BOX, LABEL_CONNECTION } from './constants';
import { editDeleteMenu } from './editDeleteMenu';
import { loadSavedDots } from "./dotsLoad";
// Generate a unique ID for dots
function generateDotId() {
    return 'dot-' + Math.random().toString(36).substr(2, 9);
}
// Main Dot Creation Function
function dotsCreate() {
    log("createDots");
    var xyPlane = document.getElementById("xy-plane");
    if (!xyPlane)
        return;
    xyPlane.addEventListener('click', function (e) {
        console.log('XYPlane click:', {
            target: e.target,
            defaultPrevented: e.defaultPrevented,
            cancelBubble: e.cancelBubble
        });
        console.log('Current dot states:', {
            selectedDotCount: document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length,
            isDragging: tpf.isDragging,
            isSelecting: isSelecting,
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
        var target = e.target;
        var dotContainer = findDotContainer(target);
        var hasSelectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected').length > 0;
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
                var coordsElement = dotContainer.querySelector('.dot-coordinates');
                if (coordsElement) {
                    // Store the current coordinates before deselecting
                    var currentCoords = coordsElement.textContent || '';
                    dotContainer.setAttribute('data-original-coords', currentCoords);
                }
                dotContainer.classList.remove('selected');
                adjustHoverBox(dotContainer);
                adjustSelectedBox(dotContainer);
                tpf.selectedDot = null;
            }
            else {
                // If clicking on a different dot, deselect the old one and select the new one
                if (tpf.selectedDot) {
                    var oldCoordsElement = tpf.selectedDot.querySelector('.dot-coordinates');
                    if (oldCoordsElement) {
                        var currentCoords = oldCoordsElement.textContent || '';
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
            var coordsElement = tpf.selectedDot.querySelector('.dot-coordinates');
            if (coordsElement) {
                // Store the current coordinates before deselecting
                var currentCoords = coordsElement.textContent || '';
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
    function xyPlaneClickHandler(event) {
        var target = event.target;
        var xyPlane = document.getElementById('xy-plane');
        if (!xyPlane)
            return;
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
        var selectedDots = document.querySelectorAll('.dot-container.selected, .dot-container.multi-selected');
        // If there are selected dots, just clear the selection and return
        if (selectedDots.length > 0) {
            selectedDots.forEach(function (dot) {
                dot.classList.remove('selected');
                dot.classList.remove('multi-selected');
                adjustHoverBox(dot);
                adjustSelectedBox(dot);
            });
            tpf.selectedDot = null;
            return;
        }
        var rawCoords = getGraphRawCoordinates(event);
        var graphCoords = {
            x: pixelToCoordinate(rawCoords.x),
            y: -pixelToCoordinate(rawCoords.y)
        };
        var pixelPosition = {
            x: coordinateToPixel(graphCoords.x),
            y: coordinateToPixel(-graphCoords.y)
        };
        var adjustedPosition = {
            x: pixelPosition.x,
            y: pixelPosition.y
        };
        var dotId = generateDotId();
        var savedDot = {
            x: adjustedPosition.x + 'px',
            y: adjustedPosition.y + 'px',
            coordinates: "(".concat(graphCoords.x.toFixed(2), ", ").concat(graphCoords.y.toFixed(2), ")"),
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
                    var dot_1 = loadSavedDots(savedDot);
                    xyPlane.appendChild(dot_1);
                    // Update connecting line after adding to DOM
                    requestAnimationFrame(function () {
                        updateConnectingLine(dot_1);
                    });
                    // Start label editing
                    var labelElement_1 = dot_1.querySelector('.user-dot-label');
                    if (labelElement_1) {
                        setTimeout(function () {
                            createLabelEditor(labelElement_1, dot_1);
                        }, 0);
                    }
                    // Fire creation event
                    var createAction = {
                        type: 'create',
                        dotId: dotId,
                        newState: savedDot
                    };
                    document.dispatchEvent(new CustomEvent('dotCreated', {
                        bubbles: true,
                        detail: createAction
                    }));
                    // Autosave if not on homepage
                    var urlParts = window.location.pathname.split('/');
                    if (urlParts.length > 2 && urlParts[1] !== '') {
                        autosaveDots();
                    }
                }
                catch (error) {
                    console.error('Error in dot creation:', error);
                }
            }
        }
    }
}
// Helper Dot Creation Function
function createNewDot(savedDot, xyPlane) {
    var _a, _b, _c;
    console.log('Creating new dot:', {
        position: { x: savedDot.x, y: savedDot.y },
        coordinates: savedDot.coordinates,
        id: savedDot.id
    });
    try {
        // Create container
        var dot_2 = document.createElement('div');
        dot_2.classList.add('dot-container');
        dot_2.classList.add('editing');
        dot_2.setAttribute('data-dot-id', (_a = savedDot.id) !== null && _a !== void 0 ? _a : '');
        dot_2.style.position = 'absolute';
        dot_2.style.left = savedDot.x;
        dot_2.style.top = savedDot.y;
        // Create dot element with centered positioning
        var dotElement = document.createElement('div');
        dotElement.className = 'dot';
        dotElement.style.position = 'absolute';
        dotElement.style.top = '50%';
        dotElement.style.left = '50%';
        dotElement.style.transform = 'translate(-50%, -50%)';
        dot_2.appendChild(dotElement);
        // Calculate dot dimensions for centering
        var dotRect = dotElement.getBoundingClientRect();
        var dotRadius = dotRect.width / 2;
        console.log('Dot element measurements:', {
            rect: dotRect,
            radius: dotRadius
        });
        // Create label container first so we can measure it
        var labelContainer_1 = document.createElement('div');
        labelContainer_1.className = 'label-container';
        Object.assign(labelContainer_1.style, {
            position: 'absolute',
            left: "".concat((_c = (_b = savedDot.labelOffset) === null || _b === void 0 ? void 0 : _b.x) !== null && _c !== void 0 ? _c : LABEL_CONNECTION.DEFAULT_LENGTH, "px"),
            backgroundColor: LABEL_CONNECTION.BOX_BACKGROUND,
            border: "".concat(LABEL_CONNECTION.BOX_BORDER_WIDTH, "px solid ").concat(LABEL_CONNECTION.BOX_BORDER_COLOR),
            borderRadius: "".concat(LABEL_CONNECTION.BOX_BORDER_RADIUS, "px"),
            padding: '8px',
            cursor: 'move',
            whiteSpace: 'nowrap',
            zIndex: '2'
        });
        labelContainer_1.innerHTML = "\n            <div class='user-dot-label'></div>\n            <div class='dot-coordinates'>".concat(savedDot.coordinates, "</div>\n        ");
        dot_2.appendChild(labelContainer_1);
        // Force a layout calculation
        dot_2.offsetHeight;
        labelContainer_1.offsetHeight;
        // Create connecting line after label container
        var line = document.createElement('div');
        line.className = 'connecting-line';
        // Initial line setup with explicit positioning
        Object.assign(line.style, {
            position: 'absolute',
            width: "".concat(LABEL_CONNECTION.DEFAULT_LENGTH, "px"),
            height: '1px',
            top: '50%',
            left: '50%',
            transform: 'rotate(0deg)', // Initial straight position
            transformOrigin: 'left center',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: "".concat(LABEL_CONNECTION.LINE_WIDTH, "px solid ").concat(LABEL_CONNECTION.LINE_COLOR),
            pointerEvents: 'none',
            display: 'block',
            zIndex: '1'
        });
        dot_2.insertBefore(line, labelContainer_1);
        // Store initial line properties
        dot_2.setAttribute('data-line-length', LABEL_CONNECTION.DEFAULT_LENGTH.toString());
        dot_2.setAttribute('data-line-angle', '0');
        // Add event listeners
        labelContainer_1.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            var labelElement = labelContainer_1.querySelector('.user-dot-label');
            if (labelElement) {
                createLabelEditor(labelElement, dot_2);
            }
        });
        dot_2.addEventListener("contextmenu", mouseContextmenu);
        dot_2.addEventListener('mousedown', mouseDown);
        dot_2.addEventListener('mouseup', mouseUp);
        window.addEventListener('mousemove', mouseMove, false);
        // Add to DOM
        xyPlane.appendChild(dot_2);
        // Immediately calculate and set the correct line position
        updateConnectingLine(dot_2);
        // Set up label editing
        var labelElement_2 = dot_2.querySelector('.user-dot-label');
        if (labelElement_2) {
            setTimeout(function () {
                createLabelEditor(labelElement_2, dot_2);
            }, 0);
        }
        // Verify final structure
        var finalMeasurements = {
            dotRect: dotElement.getBoundingClientRect(),
            lineRect: line.getBoundingClientRect(),
            labelRect: labelContainer_1.getBoundingClientRect()
        };
        console.log('Final dot verification:', {
            id: dot_2.getAttribute('data-dot-id'),
            position: {
                left: dot_2.style.left,
                top: dot_2.style.top
            },
            measurements: finalMeasurements,
            lineProperties: {
                length: dot_2.getAttribute('data-line-length'),
                angle: dot_2.getAttribute('data-line-angle'),
                transform: line.style.transform
            }
        });
        return dot_2;
    }
    catch (error) {
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
function updateConnectingLine(dot) {
    var line = dot.querySelector('.connecting-line');
    var labelContainer = dot.querySelector('.label-container');
    var dotElement = dot.querySelector('.dot');
    if (!line || !labelContainer || !dotElement) {
        console.warn('Missing elements:', { line: !!line, label: !!labelContainer, dot: !!dotElement });
        return;
    }
    // Force layout calculation to ensure accurate measurements
    dot.offsetHeight;
    labelContainer.offsetHeight;
    // Get dimensions after layout is complete
    var labelBox = labelContainer.getBoundingClientRect();
    var dotBox = dotElement.getBoundingClientRect();
    var containerRect = dot.getBoundingClientRect();
    // Calculate center points
    var dotCenterX = dotBox.left - containerRect.left + dotBox.width / 2;
    var dotCenterY = dotBox.top - containerRect.top + dotBox.height / 2;
    var labelCenterY = labelBox.top - containerRect.top + labelBox.height / 2;
    var labelLeftX = labelBox.left - containerRect.left;
    var dx = labelLeftX - dotCenterX;
    var dy = labelCenterY - dotCenterY;
    var angle = Math.atan2(dy, dx) * (180 / Math.PI);
    var length = Math.sqrt(dx * dx + dy * dy);
    try {
        // Update line properties in a single operation
        Object.assign(line.style, {
            position: 'absolute',
            width: "".concat(length, "px"),
            height: '1px',
            top: '50%',
            left: '50%',
            transform: "rotate(".concat(angle, "deg)"),
            transformOrigin: 'left center',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: "".concat(LABEL_CONNECTION.LINE_WIDTH, "px solid ").concat(LABEL_CONNECTION.LINE_COLOR),
            display: 'block',
            zIndex: '1',
            pointerEvents: 'none'
        });
        dot.setAttribute('data-line-length', length.toString());
        dot.setAttribute('data-line-angle', angle.toString());
        // Verify final positioning
        var finalLineBox = line.getBoundingClientRect();
    }
    catch (error) {
        console.error('Error updating connecting line:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dot: dot.getAttribute('data-dot-id'),
            measurements: { length: length, angle: angle }
        });
    }
}
// dot-container hover & Selected box
function adjustHoverBox(dot) {
    // Convert to HTMLElement if not already
    var dotElement = dot instanceof HTMLElement
        ? dot
        : dot.classList.contains('dot-container')
            ? dot
            : document.createElement('div');
    var labelElement = dotElement.querySelector('.user-dot-label');
    var coordsElement = dotElement.querySelector('.dot-coordinates');
    if (!labelElement || !coordsElement)
        return;
    var labelRect = labelElement.getBoundingClientRect();
    var coordsRect = coordsElement.getBoundingClientRect();
    var totalWidth = Math.max(DOT_BOX.MIN_WIDTH, Math.max(labelRect.width, coordsRect.width) + DOT_BOX.LEFT_PADDING);
    var totalHeight = Math.max(DOT_BOX.MIN_HEIGHT, coordsRect.bottom - labelRect.top + 10);
    dotElement.style.setProperty('--hover-width', "".concat(totalWidth, "px"));
    dotElement.style.setProperty('--hover-height', "".concat(totalHeight, "px"));
    dotElement.style.setProperty('--hover-top', "".concat(DOT_BOX.TOP_OFFSET, "px"));
    dotElement.style.setProperty('--hover-left', "-".concat(DOT_BOX.DOT_WIDTH / 2 + 2, "px"));
}
function adjustSelectedBox(dot) {
    // Convert to HTMLElement if not already
    var dotElement = dot instanceof HTMLElement
        ? dot
        : dot.classList.contains('dot-container')
            ? dot
            : document.createElement('div');
    var labelElement = dotElement.querySelector('.user-dot-label');
    var coordsElement = dotElement.querySelector('.dot-coordinates');
    if (!labelElement || !coordsElement)
        return;
    var labelRect = labelElement.getBoundingClientRect();
    var coordsRect = coordsElement.getBoundingClientRect();
    var totalWidth = Math.max(DOT_BOX.MIN_WIDTH, Math.max(labelRect.width, coordsRect.width) + DOT_BOX.LEFT_PADDING);
    var totalHeight = Math.max(DOT_BOX.MIN_HEIGHT, coordsRect.bottom - labelRect.top + 10);
    dotElement.style.setProperty('--hover-width', "".concat(totalWidth, "px"));
    dotElement.style.setProperty('--hover-height', "".concat(totalHeight, "px"));
    dotElement.style.setProperty('--hover-top', "".concat(DOT_BOX.TOP_OFFSET, "px"));
    dotElement.style.setProperty('--hover-left', "-".concat(DOT_BOX.DOT_WIDTH / 2 + 2, "px"));
}
function updateCoordinatePrecision(dotContainer, highPrecision) {
    var coordsElement = dotContainer.querySelector('.dot-coordinates');
    if (!coordsElement)
        return;
    // Keep using the exactly calculated coordinates
    var currentCoords = coordsElement.textContent || '';
    dotContainer.setAttribute('data-original-coords', currentCoords);
}
function xyPlaneClickHandler(event) {
    var target = event.target;
    if (target.classList.contains('dot') ||
        target.classList.contains('dot-container') ||
        target.classList.contains('coordinate-text') ||
        target.classList.contains('user-dot-label') ||
        target.classList.contains('dot-coordinates')) {
        return;
    }
    var rawCoords = getGraphRawCoordinates(event);
    var graphCoords = {
        x: pixelToCoordinate(rawCoords.x),
        y: -pixelToCoordinate(rawCoords.y)
    };
    var pixelPosition = {
        x: coordinateToPixel(graphCoords.x),
        y: coordinateToPixel(-graphCoords.y)
    };
    var adjustedPosition = {
        x: pixelPosition.x,
        y: pixelPosition.y
    };
    var dotId = generateDotId();
    var savedDot = {
        x: adjustedPosition.x + 'px',
        y: adjustedPosition.y + 'px',
        coordinates: "(".concat(graphCoords.x.toFixed(2), ", ").concat(graphCoords.y.toFixed(2), ")"),
        // For display purposes, we'll format this differently when rendering
        displayCoordinates: "(".concat(graphCoords.x.toFixed(1), ", ").concat(graphCoords.y.toFixed(1), ")"),
        label: '',
        id: dotId,
        labelOffset: {
            x: LABEL_CONNECTION.DEFAULT_LENGTH,
            y: -LABEL_CONNECTION.DEFAULT_LENGTH
        }
    };
    if (isClickInsideGraph(graphCoords)) {
        if (tpf.currentDot === null) {
            var dot_3 = addDot();
            dot_3.setAttribute('data-dot-id', dotId);
            dot_3.style.left = savedDot.x;
            dot_3.style.top = savedDot.y;
            var dotElement = document.createElement('div');
            dotElement.className = 'dot';
            dotElement.style.position = 'absolute';
            dotElement.style.top = '50%';
            dotElement.style.left = '50%';
            dotElement.style.transform = 'translate(-50%, -50%)';
            var line = document.createElement('div');
            line.className = 'connecting-line';
            line.style.position = 'absolute';
            line.style.width = "".concat(LABEL_CONNECTION.DEFAULT_LENGTH, "px");
            line.style.height = '1px';
            line.style.top = '50%';
            line.style.left = '50%';
            line.style.transformOrigin = 'left center';
            line.style.backgroundColor = LABEL_CONNECTION.LINE_COLOR;
            line.style.borderTop = "".concat(LABEL_CONNECTION.LINE_WIDTH, "px solid ").concat(LABEL_CONNECTION.LINE_COLOR);
            line.style.pointerEvents = 'none';
            line.style.display = 'block';
            line.style.visibility = 'visible';
            line.style.zIndex = '1';
            var labelContainer_2 = document.createElement('div');
            labelContainer_2.className = 'label-container';
            labelContainer_2.style.position = 'absolute';
            labelContainer_2.style.backgroundColor = LABEL_CONNECTION.BOX_BACKGROUND;
            labelContainer_2.style.border = "".concat(LABEL_CONNECTION.BOX_BORDER_WIDTH, "px solid ").concat(LABEL_CONNECTION.BOX_BORDER_COLOR);
            labelContainer_2.style.borderRadius = "".concat(LABEL_CONNECTION.BOX_BORDER_RADIUS, "px");
            labelContainer_2.style.padding = '8px';
            labelContainer_2.style.cursor = 'move';
            labelContainer_2.style.zIndex = '2';
            var labelOffset = savedDot.labelOffset || {
                x: LABEL_CONNECTION.DEFAULT_LENGTH,
                y: -LABEL_CONNECTION.DEFAULT_LENGTH
            };
            labelContainer_2.style.left = "".concat(labelOffset.x, "px");
            labelContainer_2.style.top = "".concat(labelOffset.y, "px");
            labelContainer_2.innerHTML = "\n                <div class='user-dot-label'>".concat(savedDot.label || '', "</div>\n                <div class='dot-coordinates'>").concat(savedDot.coordinates, "</div>\n            ");
            dot_3.appendChild(dotElement);
            dot_3.appendChild(line);
            dot_3.appendChild(labelContainer_2);
            dot_3.classList.add('editing');
            labelContainer_2.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                var labelElement = labelContainer_2.querySelector('.user-dot-label');
                if (labelElement) {
                    createLabelEditor(labelElement, dot_3);
                }
            });
            dot_3.addEventListener("contextmenu", mouseContextmenu);
            dot_3.addEventListener('mousedown', mouseDown);
            dot_3.addEventListener('mouseup', mouseUp);
            window.addEventListener('mousemove', mouseMove, false);
            var xyPlane = document.getElementById('xy-plane');
            if (xyPlane) {
                var dot_4 = createNewDot(savedDot, xyPlane);
                xyPlane.appendChild(dot_4);
                updateConnectingLine(dot_4);
                var labelElement_3 = dot_4.querySelector('.user-dot-label');
                if (labelElement_3) {
                    setTimeout(function () {
                        createLabelEditor(labelElement_3, dot_4);
                    }, 0);
                }
                var createAction = {
                    type: 'create',
                    dotId: dotId,
                    newState: savedDot
                };
                document.dispatchEvent(new CustomEvent('dotCreated', {
                    bubbles: true,
                    detail: createAction
                }));
                var urlParts = window.location.pathname.split('/');
                if (urlParts.length > 2 && urlParts[1] !== '') {
                    autosaveDots();
                }
            }
        }
    }
}
function createLabelEditor(labelElement, dotContainer) {
    var _this = this;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'label-input';
    // Pre-populate the input with the current label text
    input.value = labelElement.textContent || '';
    var labelRect = labelElement.getBoundingClientRect();
    var containerRect = dotContainer.getBoundingClientRect();
    input.style.top = (labelRect.top - containerRect.top) + 'px';
    input.style.left = (labelRect.left - containerRect.left) + 'px';
    var isEscPressed = false;
    var isFinishing = false;
    labelElement.style.visibility = 'hidden';
    // Use setTimeout to ensure cursor placement after focus
    setTimeout(function () {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }, 0);
    var finishEdit = function () { return __awaiter(_this, void 0, void 0, function () {
        var previousLabel, newLabel, labelChangeEvent, urlParts, dots, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isEscPressed)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    previousLabel = labelElement.textContent || '';
                    newLabel = input.value || 'null';
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
                    labelChangeEvent = new CustomEvent('dotLabelChanged', {
                        bubbles: true,
                        detail: {
                            dotId: dotContainer.getAttribute('data-dot-id'),
                            previousLabel: previousLabel,
                            newLabel: newLabel
                        }
                    });
                    document.dispatchEvent(labelChangeEvent);
                    urlParts = window.location.pathname.split('/');
                    if (!(urlParts.length > 2 && urlParts[1] !== '')) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    dots = Array.from(document.getElementsByClassName('dot-container')).map(function (dotEl) {
                        var labelEl = dotEl.querySelector('.user-dot-label');
                        var coordsElement = dotEl.querySelector('.dot-coordinates');
                        return {
                            x: dotEl.style.left,
                            y: dotEl.style.top,
                            coordinates: (coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) || '',
                            label: (labelEl === null || labelEl === void 0 ? void 0 : labelEl.textContent) || 'null'
                        };
                    });
                    return [4 /*yield*/, dotsSave(dots)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, autosaveDots()];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Error saving dots:', error_1);
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error('Error in finishEdit:', error_2);
                    if (labelElement) {
                        labelElement.style.visibility = 'visible';
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    input.addEventListener('blur', function () {
        if (isFinishing || isEscPressed)
            return;
        isFinishing = true;
        requestAnimationFrame(function () {
            if (!isEscPressed) {
                finishEdit();
            }
            labelElement.style.visibility = 'visible';
            isFinishing = false;
        });
    });
    input.addEventListener('keydown', function (e) { return __awaiter(_this, void 0, void 0, function () {
        var dotState, cancelEvent, urlParts, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(e.key === 'Enter')) return [3 /*break*/, 3];
                    e.preventDefault();
                    if (!!isFinishing) return [3 /*break*/, 2];
                    isFinishing = true;
                    return [4 /*yield*/, finishEdit()];
                case 1:
                    _b.sent();
                    labelElement.style.visibility = 'visible';
                    isFinishing = false;
                    _b.label = 2;
                case 2: return [3 /*break*/, 7];
                case 3:
                    if (!(e.key === 'Escape')) return [3 /*break*/, 7];
                    e.preventDefault();
                    isEscPressed = true;
                    dotState = {
                        x: dotContainer.style.left,
                        y: dotContainer.style.top,
                        coordinates: ((_a = dotContainer.querySelector('.dot-coordinates')) === null || _a === void 0 ? void 0 : _a.textContent) || '',
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
                    cancelEvent = new CustomEvent('dotCreateCanceled', {
                        bubbles: true,
                        detail: { dotState: dotState }
                    });
                    document.dispatchEvent(cancelEvent);
                    urlParts = window.location.pathname.split('/');
                    if (!(urlParts.length > 2 && urlParts[1] !== '')) return [3 /*break*/, 7];
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, autosaveDots()];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _b.sent();
                    console.error('Error saving after cancel:', error_3);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    dotContainer.appendChild(input);
    input.focus();
    input.select();
}
function mouseContextmenu(event) {
    log('dot.contextmenu');
    event.preventDefault();
    removeAnyExistingElementsWithClassName('edit-menu');
    var target = event.target;
    var dotContainer = findDotContainer(target);
    if (dotContainer) {
        editDeleteMenu(dotContainer);
    }
    tpf.currentDot = null;
}
function findDotContainer(element) {
    if (element.classList.contains('dot-container')) {
        return element;
    }
    if (element.parentElement) {
        return findDotContainer(element.parentElement);
    }
    return null;
}
function isClickInsideGraph(coords) {
    return coords.x >= -5 &&
        coords.x <= 5 &&
        coords.y >= -5 &&
        coords.y <= 5;
}
function getGraphRawCoordinates(event) {
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        throw new Error('xy-plane not found');
    var rect = xyPlane.getBoundingClientRect();
    var x = event.clientX - rect.left + 0; // Subtract half dot height (4px/2)
    var y = event.clientY - rect.top + 0; // Subtract half dot height (4px/2)
    return { x: x, y: y };
}
function addDot() {
    var dot = document.createElement("div");
    dot.classList.add("dot-container");
    dot.classList.add("editing");
    return dot;
}
function inspectDotStructure(dot) {
    // Get all elements
    var line = dot.querySelector('.connecting-line');
    var label = dot.querySelector('.label-container');
    var dotElement = dot.querySelector('.dot');
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
                position: line.style.position,
                width: line.style.width,
                height: line.style.height,
                transform: line.style.transform,
                backgroundColor: line.style.backgroundColor
            }
        } : null,
        label: label ? {
            classList: Array.from(label.classList),
            style: {
                position: label.style.position,
                left: label.style.left,
                top: label.style.top
            }
        } : null,
        dotElement: dotElement ? {
            classList: Array.from(dotElement.classList),
            style: {
                position: dotElement.style.position,
                left: dotElement.style.left,
                top: dotElement.style.top
            }
        } : null
    });
}
export { dotsCreate, updateConnectingLine, adjustHoverBox, adjustSelectedBox, createLabelEditor };
