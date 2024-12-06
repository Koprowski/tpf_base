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
import { mouseDown, mouseUp } from './mouseEvents';
//import { coordinateToPixel, pixelToCoordinate } from './createTickMarks';
import { tpf } from './data';
import log from "./util.log";
import { DOT_BOX, LABEL_CONNECTION } from './constants';
import { generateDotId } from './data';
import { updateConnectingLine } from './utils';
import { createLabelEditor } from './dotsCreate';
import { DEBUG } from './constants';
import { debounce } from './keyboardUtils';
function loadSavedDots(savedDot) {
    var _a;
    var dot = document.createElement('div');
    dot.classList.add('dot-container');
    dot.setAttribute('data-dot-id', savedDot.id || generateDotId());
    dot.style.position = 'absolute';
    dot.style.left = savedDot.x;
    dot.style.top = savedDot.y;
    dot.setAttribute('data-original-position', JSON.stringify({
        x: savedDot.x,
        y: savedDot.y
    }));
    try {
        if (!savedDot.coordinates) {
            throw new Error('Missing coordinates string');
        }
        var coordMatch = savedDot.coordinates.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
        if (!coordMatch) {
            throw new Error('Invalid coordinates format');
        }
        var gridX = parseFloat(coordMatch[1]);
        var gridY = parseFloat(coordMatch[2]);
        if (isNaN(gridX) || isNaN(gridY)) {
            throw new Error('Invalid coordinate values');
        }
        // Create dot element with proper positioning
        var dotElement = document.createElement('div');
        dotElement.className = 'dot';
        dotElement.style.position = 'absolute';
        dotElement.style.top = 'calc(50% - 1px)'; // Negative makes it go down
        dotElement.style.left = 'calc(50% - 2px)'; // Negative adj makes it go right
        dotElement.setAttribute('data-position-set', 'true');
        dot.appendChild(dotElement);
        // Get dot dimensions for centering
        var dotRect = dotElement.getBoundingClientRect();
        var dotRadius = dotRect.width / 2;
        // Use saved label position or default
        var labelPosition = savedDot.labelOffset || {
            x: LABEL_CONNECTION.DEFAULT_LENGTH,
            y: -LABEL_CONNECTION.DEFAULT_LENGTH
        };
        // Create connecting line with precise measurements
        var line_1 = document.createElement('div');
        line_1.className = 'connecting-line';
        var lineLength = savedDot.lineLength ||
            Math.sqrt(labelPosition.x * labelPosition.x + labelPosition.y * labelPosition.y);
        Object.assign(line_1.style, {
            position: 'absolute',
            width: "".concat(lineLength, "px"),
            height: '1px',
            transformOrigin: "".concat(dotRadius, "px center"),
            backgroundColor: LABEL_CONNECTION.LINE_COLOR,
            borderTop: "".concat(LABEL_CONNECTION.LINE_WIDTH, "px solid ").concat(LABEL_CONNECTION.LINE_COLOR),
            pointerEvents: 'none',
            display: 'block',
            visibility: 'visible',
            zIndex: '1'
        });
        // Validate line styles
        if (!line_1.style.width || !line_1.style.transformOrigin) {
            console.error('Failed to apply line styles');
            throw new Error('Line style application failed');
        }
        dot.setAttribute('data-line-length', lineLength.toString());
        // Calculate and apply line angle
        var lineAngle = (_a = savedDot.lineAngle) !== null && _a !== void 0 ? _a : Math.atan2(labelPosition.y, labelPosition.x) * (180 / Math.PI);
        line_1.style.transform = "rotate(".concat(lineAngle, "deg)");
        dot.setAttribute('data-line-angle', lineAngle.toString());
        dot.appendChild(line_1);
        // Create label container with precise positioning
        var labelContainer_1 = document.createElement('div');
        labelContainer_1.className = 'label-container';
        Object.assign(labelContainer_1.style, {
            position: 'absolute',
            left: "".concat(labelPosition.x, "px"),
            top: "".concat(labelPosition.y, "px"),
            backgroundColor: LABEL_CONNECTION.BOX_BACKGROUND,
            border: "".concat(LABEL_CONNECTION.BOX_BORDER_WIDTH, "px solid ").concat(LABEL_CONNECTION.BOX_BORDER_COLOR),
            borderRadius: "".concat(LABEL_CONNECTION.BOX_BORDER_RADIUS, "px"),
            padding: '8px',
            cursor: 'move',
            whiteSpace: 'nowrap',
            zIndex: '2'
        });
        labelContainer_1.innerHTML = "\n            <div class='user-dot-label'>".concat(savedDot.label || '', "</div>\n            <div class='dot-coordinates'>").concat(savedDot.coordinates, "</div>\n        ");
        // Verify label elements
        if (!labelContainer_1.querySelector('.user-dot-label') ||
            !labelContainer_1.querySelector('.dot-coordinates')) {
            throw new Error('Failed to create label elements');
        }
        dot.appendChild(labelContainer_1);
        // Add drag event listener
        labelContainer_1.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            // Instead of startLabelBoxDrag, we want to trigger label editing
            var labelElement = labelContainer_1.querySelector('.user-dot-label');
            if (labelElement) {
                createLabelEditor(labelElement, dot);
            }
        });
        // Store complete position data
        dot.setAttribute('data-position', JSON.stringify({
            x: gridX,
            y: gridY,
            labelOffset: labelPosition,
            lineLength: lineLength,
            lineAngle: lineAngle
        }));
        // Store original offset for debugging and state management
        dot.setAttribute('data-original-offset', JSON.stringify(labelPosition));
        // Verify layout and measurements
        Promise.resolve().then(function () {
            var lineRect = line_1.getBoundingClientRect();
            var labelRect = labelContainer_1.getBoundingClientRect();
            if (lineRect.width === 0 || labelRect.width === 0) {
                console.warn('Zero-width elements detected, updating layout');
                updateConnectingLine(dot);
            }
        });
        // Initial line update
        requestAnimationFrame(function () { return updateConnectingLine(dot); });
        var labelBounds = labelContainer_1.getBoundingClientRect();
        var dotBounds = dot.getBoundingClientRect();
    }
    catch (error) {
        console.error('Error creating dot:', error);
        console.error('Creation error details:', {
            savedDot: savedDot,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        // Fallback creation with minimum required elements
        dot.innerHTML = "\n            <div class='dot'></div>\n            <div class='connecting-line'></div>\n            <div class='label-container'>\n                <div class='user-dot-label'>".concat(savedDot.label || '', "</div>\n                <div class='dot-coordinates'>(0.00, 0.00)</div>\n            </div>\n        ");
    }
    // Add core event listeners
    dot.addEventListener('mousedown', mouseDown);
    dot.addEventListener('mouseup', mouseUp);
    dot.addEventListener('mouseover', function () {
        if (!dot.classList.contains('editing')) {
            adjustHoverBox(dot);
        }
    });
    return dot;
}
var debouncedAdjustHover = debounce(function (dotContainer) {
    if (dotContainer.hasAttribute('data-hover-width') &&
        dotContainer.hasAttribute('data-hover-height') &&
        !dotContainer.classList.contains('editing')) {
        var storedWidth = dotContainer.getAttribute('data-hover-width');
        var storedHeight = dotContainer.getAttribute('data-hover-height');
        if (DEBUG) {
            console.log('Using cached hover dimensions:', {
                width: storedWidth,
                height: storedHeight,
                dotId: dotContainer.getAttribute('data-dot-id')
            });
        }
        dotContainer.style.setProperty('--hover-width', storedWidth);
        dotContainer.style.setProperty('--hover-height', storedHeight);
        dotContainer.style.setProperty('--hover-top', '-23px');
        dotContainer.style.setProperty('--hover-left', '-5px');
        return;
    }
    var labelElement = dotContainer.querySelector('.user-dot-label');
    var coordsElement = dotContainer.querySelector('.dot-coordinates');
    if (!labelElement || !coordsElement)
        return;
    var labelRect = labelElement.getBoundingClientRect();
    var coordsRect = coordsElement.getBoundingClientRect();
    var totalWidth = "".concat(Math.max(DOT_BOX.MIN_WIDTH, Math.max(labelRect.width, coordsRect.width) + DOT_BOX.LEFT_PADDING), "px");
    var totalHeight = "".concat(Math.max(DOT_BOX.MIN_HEIGHT, coordsRect.bottom - labelRect.top + 10), "px");
    if (DEBUG) {
        console.log('Calculating new hover dimensions:', {
            width: totalWidth,
            height: totalHeight,
            dotId: dotContainer.getAttribute('data-dot-id')
        });
    }
    dotContainer.setAttribute('data-hover-width', totalWidth);
    dotContainer.setAttribute('data-hover-height', totalHeight);
    dotContainer.style.setProperty('--hover-width', totalWidth);
    dotContainer.style.setProperty('--hover-height', totalHeight);
    dotContainer.style.setProperty('--hover-top', "".concat(DOT_BOX.TOP_OFFSET, "px"));
    dotContainer.style.setProperty('--hover-left', "-".concat(DOT_BOX.DOT_WIDTH / 2 + 2, "px"));
}, 100); // 100ms debounce
function adjustHoverBox(dotContainer) {
    debouncedAdjustHover(dotContainer);
}
function initializeDotFromSaved(savedDot) {
    console.log('Initializing dot from saved data:', savedDot);
    return loadSavedDots(savedDot);
}
function waitForXYPlane() {
    return new Promise(function (resolve) {
        var checkXYPlane = function () {
            var xyPlane = document.getElementById("xy-plane");
            if (xyPlane && xyPlane.getBoundingClientRect().width > 0) {
                resolve();
            }
            else {
                setTimeout(checkXYPlane, 50);
            }
        };
        checkXYPlane();
    });
}
function handleContextMenu(event) {
    log('dot.contextmenu');
    event.preventDefault();
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
function dotsLoad() {
    return __awaiter(this, void 0, void 0, function () {
        var MAX_RETRIES, retryCount, _loop_1, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    MAX_RETRIES = 3;
                    retryCount = 0;
                    _loop_1 = function () {
                        var urlParts, urlId, response, data, dots, xyPlane_1, existingDots, error_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 5]);
                                    urlParts = window.location.pathname.split('/');
                                    if (urlParts.length <= 2 || urlParts[1] === '') {
                                        log('Homepage detected - skipping load', 'dots');
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    urlId = urlParts[urlParts.length - 1];
                                    console.log('Loading dots for URL ID:', urlId);
                                    return [4 /*yield*/, fetch("/api/pages/".concat(urlId, "/dots"), {
                                            method: 'GET',
                                            headers: {
                                                'Accept': 'application/json',
                                                'Content-Type': 'application/json',
                                            },
                                            credentials: 'same-origin'
                                        })];
                                case 1:
                                    response = _b.sent();
                                    if (!response.ok) {
                                        throw new Error("Failed to load dots: ".concat(response.status));
                                    }
                                    return [4 /*yield*/, response.json()];
                                case 2:
                                    data = _b.sent();
                                    dots = Array.isArray(data) ? data : (data.dots || []);
                                    console.log('Processed dots array from server:', JSON.stringify(dots, null, 2));
                                    xyPlane_1 = document.getElementById('xy-plane');
                                    if (!xyPlane_1) {
                                        throw new Error('XY Plane not found');
                                    }
                                    existingDots = xyPlane_1.getElementsByClassName('dot-container');
                                    Array.from(existingDots).forEach(function (dot) { return dot.remove(); });
                                    dots.forEach(function (dot) {
                                        try {
                                            // Process incoming dot data
                                            var processedDot = __assign(__assign({}, dot), { x: dot.x.includes('px') ? dot.x : "".concat(dot.x, "px"), y: dot.y.includes('px') ? dot.y : "".concat(dot.y, "px"), coordinates: dot.coordinates, label: dot.label, labelOffset: dot.labelOffset || { x: 50, y: -50 }, lineLength: dot.lineLength || 70.71067811865476 });
                                            var dotElement = initializeDotFromSaved(processedDot);
                                            xyPlane_1.appendChild(dotElement);
                                            // Verify dot creation
                                            var labelContainer = dotElement.querySelector('.label-container');
                                            // Validate created elements
                                            var validation = {
                                                hasLabel: !!dotElement.querySelector('.user-dot-label'),
                                                hasCoords: !!dotElement.querySelector('.dot-coordinates'),
                                                hasLine: !!dotElement.querySelector('.connecting-line')
                                            };
                                            if (!validation.hasLabel || !validation.hasCoords || !validation.hasLine) {
                                                console.warn('Dot missing required elements:', validation);
                                            }
                                            // Check position values
                                            var position = {
                                                left: dotElement.style.left,
                                                top: dotElement.style.top
                                            };
                                            if (!position.left || !position.top) {
                                                console.warn('Invalid dot position:', position);
                                            }
                                        }
                                        catch (error) {
                                            console.error('Error creating individual dot:', error);
                                            console.error('Failed dot data:', dot);
                                            if (error instanceof Error) {
                                                console.error('Creation error details:', {
                                                    message: error.message,
                                                    stack: error.stack
                                                });
                                            }
                                        }
                                    });
                                    return [2 /*return*/, { value: void 0 }];
                                case 3:
                                    error_1 = _b.sent();
                                    console.error("Attempt ".concat(retryCount + 1, " failed:"), error_1);
                                    retryCount++;
                                    if (retryCount === MAX_RETRIES) {
                                        console.error('Failed to load dots after maximum retries');
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, Math.pow(2, retryCount) * 1000); })];
                                case 4:
                                    _b.sent();
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(retryCount < MAX_RETRIES)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    });
}
export { dotsLoad, adjustHoverBox, waitForXYPlane, handleContextMenu, findDotContainer, loadSavedDots };
