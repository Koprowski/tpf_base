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
import log from "./util.log";
import { LABEL_CONNECTION } from './constants';
function collectDots() {
    var dots = [];
    var dotContainers = document.querySelectorAll('.dot-container');
    log('Found dot containers');
    console.log('Found dot containers:', dotContainers.length);
    console.log('Starting dot collection process');
    dotContainers.forEach(function (container) {
        try {
            var dotEl = container;
            var labelEl = dotEl.querySelector('.user-dot-label');
            var coordsEl = dotEl.querySelector('.dot-coordinates');
            var labelContainer = dotEl.querySelector('.label-container');
            var line = dotEl.querySelector('.connecting-line');
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
            var computedStyle = window.getComputedStyle(dotEl);
            var left = dotEl.style.left || computedStyle.left;
            var top_1 = dotEl.style.top || computedStyle.top;
            if (!left || !top_1 || left === 'auto' || top_1 === 'auto') {
                console.warn('Invalid position for dot:', { left: left, top: top_1 });
                return;
            }
            console.log('Processing label container:', {
                exists: !!labelContainer,
                element: labelContainer,
                parentNode: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.parentNode
            });
            var defaultLabelOffset = {
                x: LABEL_CONNECTION.DEFAULT_LENGTH,
                y: -LABEL_CONNECTION.DEFAULT_LENGTH / Math.sqrt(2)
            };
            var labelOffset = __assign({}, defaultLabelOffset);
            var lineAngle = -45;
            if (labelContainer && line) {
                var leftValue = parseFloat(labelContainer.style.left);
                var topValue = parseFloat(labelContainer.style.top);
                if (!isNaN(leftValue)) {
                    labelOffset.x = leftValue;
                    console.log('Valid left offset:', leftValue);
                }
                else {
                    console.warn('Invalid left offset, using default:', LABEL_CONNECTION.DEFAULT_LENGTH);
                }
                if (!isNaN(topValue)) {
                    labelOffset.y = topValue;
                    console.log('Valid top offset:', topValue);
                }
                else {
                    console.warn('Invalid top offset, using default:', -LABEL_CONNECTION.DEFAULT_LENGTH / Math.sqrt(2));
                }
                var transform = line.style.transform;
                var angleMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
                if (angleMatch) {
                    var parsedAngle = parseFloat(angleMatch[1]);
                    if (!isNaN(parsedAngle)) {
                        lineAngle = parsedAngle;
                        console.log('Extracted line angle:', lineAngle);
                    }
                }
                else {
                    console.warn('Could not extract line angle, using default:', lineAngle);
                }
            }
            console.log('Label container position details:', {
                element: labelContainer,
                leftStyle: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.style.left,
                topStyle: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.style.top,
                computedOffset: labelOffset,
                rawLeft: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.style.left,
                rawTop: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.style.top,
                lineAngle: lineAngle
            });
            var lineLength = parseFloat(dotEl.getAttribute('data-line-length') || '');
            if (isNaN(lineLength)) {
                lineLength = Math.sqrt(labelOffset.x * labelOffset.x + labelOffset.y * labelOffset.y);
                console.log('Calculated line length from offset:', lineLength);
            }
            else {
                console.log('Using stored line length:', lineLength);
            }
            console.log('Line length calculation details:', {
                dataAttribute: dotEl.getAttribute('data-line-length'),
                calculated: Math.sqrt(labelOffset.x * labelOffset.x + labelOffset.y * labelOffset.y),
                final: lineLength,
                isValid: !isNaN(lineLength),
                angle: lineAngle,
                transform: line === null || line === void 0 ? void 0 : line.style.transform
            });
            var dotData = {
                x: left,
                y: top_1,
                coordinates: (coordsEl === null || coordsEl === void 0 ? void 0 : coordsEl.textContent) || '',
                label: (labelEl === null || labelEl === void 0 ? void 0 : labelEl.textContent) || 'null',
                labelOffset: labelOffset,
                lineLength: lineLength,
                lineAngle: lineAngle
            };
            var validationIssues = [];
            if (!dotData.coordinates)
                validationIssues.push('missing coordinates');
            if (!dotData.x)
                validationIssues.push('missing x position');
            if (!dotData.y)
                validationIssues.push('missing y position');
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
                        labelOffset: labelOffset,
                        lineLength: lineLength,
                        lineAngle: lineAngle,
                        transform: line === null || line === void 0 ? void 0 : line.style.transform
                    }
                });
            }
            console.log('Complete dot data for saving:', {
                dotData: dotData,
                validationIssues: validationIssues,
                isValid: validationIssues.length === 0,
                elementDetails: {
                    hasLabel: !!labelEl,
                    hasCoords: !!coordsEl,
                    hasContainer: !!labelContainer,
                    hasLine: !!line
                },
                styles: {
                    transform: line === null || line === void 0 ? void 0 : line.style.transform,
                    labelLeft: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.style.left,
                    labelTop: labelContainer === null || labelContainer === void 0 ? void 0 : labelContainer.style.top
                }
            });
            dots.push(dotData);
        }
        catch (error) {
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
        dotsWithLabels: dots.filter(function (d) { return d.label !== 'null'; }).length,
        dotsWithOffsets: dots.filter(function (d) { return d.labelOffset !== undefined; }).length,
        dotsWithAngles: dots.filter(function (d) { return d.lineAngle !== undefined; }).length,
        validDots: dots.filter(function (d) { return d.labelOffset && !isNaN(d.labelOffset.x) && !isNaN(d.labelOffset.y); }).length
    });
    log('Collection complete');
    return dots;
}
export function dotsSave(dots) {
    return __awaiter(this, void 0, void 0, function () {
        var urlParts, urlId, dotsToSave, processedDots, response, errorText, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('saveDots');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    urlParts = window.location.pathname.split('/');
                    if (urlParts.length <= 2 || urlParts[1] === '') {
                        console.log('Skipping save - on homepage');
                        return [2 /*return*/];
                    }
                    urlId = urlParts[urlParts.length - 1];
                    dotsToSave = dots.length === 0 ? collectDots() : dots;
                    console.log('Pre-save state:', JSON.stringify(dotsToSave, null, 2));
                    if (dotsToSave.length === 0) {
                        console.log('No dots to save');
                        return [2 /*return*/];
                    }
                    processedDots = dotsToSave.map(function (dot) {
                        var _a, _b;
                        // Remove 'px' suffix and convert to numbers
                        var x = dot.x ? parseFloat(dot.x.replace('px', '')) : 0;
                        var y = dot.y ? parseFloat(dot.y.replace('px', '')) : 0;
                        // Extract grid coordinates for validation
                        var coordMatch = dot.coordinates.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
                        var gridX = coordMatch ? parseFloat(coordMatch[1]) : 0;
                        var gridY = coordMatch ? parseFloat(coordMatch[2]) : 0;
                        if (isNaN(x) || isNaN(y) || isNaN(gridX) || isNaN(gridY)) {
                            console.warn('Invalid coordinate values:', {
                                x: x,
                                y: y,
                                gridX: gridX,
                                gridY: gridY,
                                raw: { x: dot.x, y: dot.y, coordinates: dot.coordinates }
                            });
                        }
                        // Default label offset if not provided
                        var labelOffset = {
                            x: ((_a = dot.labelOffset) === null || _a === void 0 ? void 0 : _a.x) || LABEL_CONNECTION.DEFAULT_LENGTH,
                            y: ((_b = dot.labelOffset) === null || _b === void 0 ? void 0 : _b.y) || -LABEL_CONNECTION.DEFAULT_LENGTH
                        };
                        // Validate line length
                        var lineLength = dot.lineLength;
                        if (!lineLength || isNaN(lineLength)) {
                            lineLength = Math.sqrt(Math.pow(labelOffset.x, 2) +
                                Math.pow(labelOffset.y, 2));
                            console.log('Calculated missing line length:', lineLength);
                        }
                        // Log validation details
                        console.log('Processing dot:', {
                            originalState: dot,
                            processedValues: {
                                x: x,
                                y: y,
                                gridCoords: { x: gridX, y: gridY },
                                labelOffset: labelOffset,
                                lineLength: lineLength
                            }
                        });
                        return {
                            x: String(x),
                            y: String(y),
                            coordinates: dot.coordinates,
                            label: dot.label || '',
                            labelOffset: labelOffset,
                            lineLength: lineLength
                        };
                    });
                    console.log('Sending dots to API:', JSON.stringify(processedDots));
                    console.log('Pre-save state:', JSON.stringify(processedDots, null, 2));
                    return [4 /*yield*/, fetch("/api/pages/".concat(urlId, "/dots"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ dots: processedDots }),
                            credentials: 'same-origin'
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text()];
                case 3:
                    errorText = _a.sent();
                    console.error('Server error details:', {
                        status: response.status,
                        statusText: response.statusText,
                        responseBody: errorText,
                        sentData: processedDots
                    });
                    throw new Error("Failed to save dots: ".concat(response.status, " ").concat(response.statusText));
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    result = _a.sent();
                    console.log('Save successful:', JSON.stringify(result, null, 2));
                    return [2 /*return*/, result];
                case 6:
                    error_1 = _a.sent();
                    console.error('Save error:', error_1);
                    if (error_1 instanceof Error) {
                        console.error('Error details:', {
                            message: error_1.message,
                            stack: error_1.stack,
                            type: error_1.name
                        });
                    }
                    throw error_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
export function autosaveDots() {
    return __awaiter(this, void 0, void 0, function () {
        var dots, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    dots = collectDots();
                    return [4 /*yield*/, dotsSave(dots)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error in autosave:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
export function getCurrentDots() {
    return collectDots();
}
