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
import log from "./util.log";
import { updateConnectingLine } from './utils';
import { adjustHoverBox, createLabelEditor } from './dotsCreate';
import { LABEL_CONNECTION } from './constants';
// Initialize undo history
var undoHistory = [];
var maxUndoHistory = 50;
var tpf = {
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
document.addEventListener('DOMContentLoaded', function () {
    var xAxis = document.getElementsByClassName("x-axis")[0];
    var yAxis = document.getElementsByClassName("y-axis")[0];
    if (xAxis && yAxis) {
        tpf.xAxisWidth = xAxis.clientWidth;
        tpf.yAxisHeight = yAxis.clientHeight;
    }
    document.addEventListener('keydown', handleKeyboardDelete);
    document.addEventListener('keydown', handleUndo);
});
function generateDotId() {
    return 'dot-' + Math.random().toString(36).substr(2, 9);
}
function addToUndoHistory(action) {
    undoHistory.push(action);
    if (undoHistory.length > maxUndoHistory) {
        undoHistory.shift();
    }
}
function recordDotState(dot) {
    var labelEl = dot.querySelector('.user-dot-label');
    var coordsElement = dot.querySelector('.dot-coordinates');
    return {
        x: dot.style.left,
        y: dot.style.top,
        coordinates: (coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) || '',
        label: (labelEl === null || labelEl === void 0 ? void 0 : labelEl.textContent) || '',
        id: dot.getAttribute('data-dot-id') || generateDotId()
    };
}
function updateDotState(dot, state) {
    dot.style.left = state.x;
    dot.style.top = state.y;
    var coordsElement = dot.querySelector('.dot-coordinates');
    if (coordsElement) {
        coordsElement.textContent = state.coordinates;
    }
    var labelEl = dot.querySelector('.user-dot-label');
    if (labelEl) {
        labelEl.textContent = state.label;
    }
    if (state.id) {
        dot.setAttribute('data-dot-id', state.id);
    }
}
function handleUndo(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        var lastAction = undoHistory.pop();
        if (!lastAction)
            return;
        var xyPlane = document.getElementById('xy-plane');
        if (!xyPlane)
            return;
        try {
            switch (lastAction.type) {
                case 'move':
                    if (lastAction.previousState) {
                        var dot = document.querySelector("[data-dot-id=\"".concat(lastAction.dotId, "\"]"));
                        if (dot) {
                            // Store current state for potential redo
                            var currentState = recordDotState(dot);
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
                        var newDot_1 = createDotElement(lastAction.previousState);
                        // Set the position explicitly
                        newDot_1.style.left = lastAction.previousState.x;
                        newDot_1.style.top = lastAction.previousState.y;
                        // Add to DOM
                        xyPlane.appendChild(newDot_1);
                        // Update connecting line and layout
                        requestAnimationFrame(function () {
                            updateConnectingLine(newDot_1);
                            if (newDot_1.classList.contains('selected')) {
                                adjustHoverBox(newDot_1);
                            }
                        });
                        autosaveAfterUndo();
                    }
                    break;
                case 'create':
                    var dotToRemove = document.querySelector("[data-dot-id=\"".concat(lastAction.dotId, "\"]"));
                    if (dotToRemove) {
                        // Store state before removal for potential redo
                        var stateBeforeRemoval = recordDotState(dotToRemove);
                        dotToRemove.remove();
                        autosaveAfterUndo();
                    }
                    break;
                case 'labelMove':
                    if (lastAction.previousState) {
                        var dot = document.querySelector("[data-dot-id=\"".concat(lastAction.dotId, "\"]"));
                        if (dot) {
                            var labelContainer = dot.querySelector('.label-container');
                            if (labelContainer && lastAction.previousState.labelOffset) {
                                labelContainer.style.left = "".concat(lastAction.previousState.labelOffset.x, "px");
                                labelContainer.style.top = "".concat(lastAction.previousState.labelOffset.y, "px");
                                updateConnectingLine(dot);
                                autosaveAfterUndo();
                            }
                        }
                    }
                    break;
            }
        }
        catch (error) {
            console.error('Error in undo operation:', error);
        }
    }
}
function createDotElement(state) {
    var dot = document.createElement('div');
    dot.className = 'dot-container';
    dot.setAttribute('data-dot-id', state.id || generateDotId());
    dot.style.position = 'absolute';
    dot.style.left = state.x;
    dot.style.top = state.y;
    dot.style.transform = 'translate(-50%, -50%)';
    try {
        // Create dot element with centered positioning
        var dotElement = document.createElement('div');
        dotElement.className = 'dot';
        dotElement.style.position = 'absolute';
        dotElement.style.top = '50%';
        dotElement.style.left = '50%';
        dotElement.style.transform = 'translate(-50%, -50%)';
        dot.appendChild(dotElement);
        // Get saved label position or use defaults
        var labelOffset_1 = state.labelOffset || {
            x: LABEL_CONNECTION.DEFAULT_LENGTH,
            y: -LABEL_CONNECTION.DEFAULT_LENGTH
        };
        // Calculate line length from offset or use saved value
        var lineLength = state.lineLength ||
            Math.sqrt(labelOffset_1.x * labelOffset_1.x + labelOffset_1.y * labelOffset_1.y);
        // Calculate line angle from offset or use saved value
        var lineAngle = state.lineAngle ||
            Math.atan2(labelOffset_1.y, labelOffset_1.x) * (180 / Math.PI);
        // Create connecting line before label container
        var line = document.createElement('div');
        line.className = 'connecting-line';
        Object.assign(line.style, {
            position: 'absolute',
            width: "".concat(lineLength, "px"),
            height: '1px',
            top: '50%',
            left: '50%',
            transform: "rotate(".concat(lineAngle, "deg)"),
            transformOrigin: 'left center',
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: "".concat(LABEL_CONNECTION.LINE_WIDTH, "px solid ").concat(LABEL_CONNECTION.LINE_COLOR),
            pointerEvents: 'none',
            display: 'block',
            zIndex: '1'
        });
        dot.appendChild(line);
        // Store line properties
        dot.setAttribute('data-line-length', lineLength.toString());
        dot.setAttribute('data-line-angle', lineAngle.toString());
        // Create label container with stored positioning
        var labelContainer_1 = document.createElement('div');
        labelContainer_1.className = 'label-container';
        Object.assign(labelContainer_1.style, {
            position: 'absolute',
            left: "".concat(labelOffset_1.x, "px"),
            top: "".concat(labelOffset_1.y, "px"),
            backgroundColor: LABEL_CONNECTION.BOX_BACKGROUND,
            border: "".concat(LABEL_CONNECTION.BOX_BORDER_WIDTH, "px solid ").concat(LABEL_CONNECTION.BOX_BORDER_COLOR),
            borderRadius: "".concat(LABEL_CONNECTION.BOX_BORDER_RADIUS, "px"),
            padding: '8px',
            cursor: 'move',
            whiteSpace: 'nowrap',
            zIndex: '2'
        });
        labelContainer_1.innerHTML = "\n            <div class='user-dot-label'>".concat(state.label, "</div>\n            <div class='dot-coordinates'>").concat(state.coordinates, "</div>\n        ");
        // Add double-click handler for label editing
        labelContainer_1.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            var labelElement = labelContainer_1.querySelector('.user-dot-label');
            if (labelElement) {
                createLabelEditor(labelElement, dot);
            }
        });
        dot.appendChild(labelContainer_1);
        // Store original offset for reference
        dot.setAttribute('data-original-offset', JSON.stringify(labelOffset_1));
        // Add event listeners
        dot.addEventListener('contextmenu', function (e) { return e.preventDefault(); });
        dot.addEventListener('mousedown', function (e) {
            var target = e.target;
            if (target.classList.contains('dot-container')) {
                e.preventDefault();
                tpf.isDragging = true;
                tpf.currentDot = target;
            }
        });
        // Store original coordinates
        dot.setAttribute('data-original-coords', state.coordinates);
        // Force layout calculation and update connecting line
        requestAnimationFrame(function () {
            updateConnectingLine(dot);
            // Verify label position after layout
            if (labelContainer_1 && labelOffset_1) {
                labelContainer_1.style.left = "".concat(labelOffset_1.x, "px");
                labelContainer_1.style.top = "".concat(labelOffset_1.y, "px");
            }
        });
    }
    catch (error) {
        console.error('Error creating dot element:', error);
    }
    return dot;
}
function handleKeyboardDelete(event) {
    return __awaiter(this, void 0, void 0, function () {
        var previousState, dotToDelete, urlParts, deleteEvent, error_1, urlParts, xyPlane, restoredDot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(event.key === 'Delete' && tpf.selectedDot)) return [3 /*break*/, 5];
                    event.preventDefault();
                    previousState = void 0;
                    dotToDelete = tpf.selectedDot;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    previousState = recordDotState(dotToDelete);
                    addToUndoHistory({
                        type: 'delete',
                        dotId: dotToDelete.getAttribute('data-dot-id') || generateDotId(),
                        previousState: previousState
                    });
                    dotToDelete.remove();
                    tpf.selectedDot = null;
                    urlParts = window.location.pathname.split('/');
                    if (!(urlParts.length > 2 && urlParts[1] !== '')) return [3 /*break*/, 3];
                    return [4 /*yield*/, autosaveAfterUndo()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    deleteEvent = new CustomEvent('dotDeleted', { bubbles: true });
                    document.dispatchEvent(deleteEvent);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to process delete:', error_1);
                    urlParts = window.location.pathname.split('/');
                    if (urlParts.length > 2 && urlParts[1] !== '' && previousState) {
                        xyPlane = document.getElementById('xy-plane');
                        if (xyPlane) {
                            restoredDot = createDotElement(previousState);
                            xyPlane.appendChild(restoredDot);
                            tpf.selectedDot = restoredDot;
                        }
                        alert('Failed to delete dot. Please try again.');
                    }
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function autosaveAfterUndo() {
    return __awaiter(this, void 0, void 0, function () {
        var urlParts, dots, urlId, response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    urlParts = window.location.pathname.split('/');
                    if (urlParts.length <= 2 || urlParts[1] === '') {
                        return [2 /*return*/];
                    }
                    dots = Array.from(document.getElementsByClassName('dot-container')).map(function (dotEl) {
                        var labelEl = dotEl.querySelector('.user-dot-label');
                        var coordsElement = dotEl.querySelector('.dot-coordinates');
                        var x = dotEl.style.left;
                        var y = dotEl.style.top;
                        if (!x || !y) {
                            throw new Error('Invalid dot position');
                        }
                        return {
                            x: x,
                            y: y,
                            coordinates: (coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) || '',
                            label: (labelEl === null || labelEl === void 0 ? void 0 : labelEl.textContent) || 'null'
                        };
                    });
                    urlId = urlParts[urlParts.length - 1];
                    return [4 /*yield*/, fetch("/api/pages/".concat(urlId, "/dots"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ dots: dots }),
                            credentials: 'same-origin'
                        })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to save dots');
                    }
                    log('Autosave completed', 'dots');
                    return [2 /*return*/, data];
                case 3:
                    error_2 = _a.sent();
                    if (window.location.pathname !== '/' && window.location.pathname !== '/index') {
                        console.error('Error saving after undo:', error_2);
                        throw error_2;
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
export { tpf, recordDotState, generateDotId, addToUndoHistory };
