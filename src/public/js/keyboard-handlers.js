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
// File: src/public/ts/keyboard-handlers.ts
import { tpf, recordDotState, generateDotId, addToUndoHistory } from './data';
import { dotsSave } from './dotsSave';
// Add undoHistory array
var undoHistory = [];
export function updateDotState(dot, state) {
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
export function autosaveAfterUndo() {
    return __awaiter(this, void 0, void 0, function () {
        var urlParts, dots, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    urlParts = window.location.pathname.split('/');
                    if (urlParts.length <= 2 || urlParts[1] === '') {
                        return [2 /*return*/];
                    }
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
                case 1:
                    _a.sent();
                    console.log('Page auto-saved successfully');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (window.location.pathname !== '/' && window.location.pathname !== '/index') {
                        console.error('Error saving after undo:', error_1);
                        throw error_1;
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createDotElement(state) {
    var dot = document.createElement('div');
    dot.className = 'dot-container';
    dot.setAttribute('data-dot-id', state.id || generateDotId());
    dot.style.transform = 'translate(-50%, -50%)';
    updateDotState(dot, state);
    dot.innerHTML = "\n        <div class='dot' style=\"position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);\"></div>\n        <div class='coordinate-text' style=\"position: absolute; left: 15px; top: 50%; transform: translateY(-50%);\">\n            <div class='user-dot-label' style='position: relative; margin-bottom: 4px;'>".concat(state.label, "</div>\n            <div class='dot-coordinates' style='position: relative;'>").concat(state.coordinates, "</div>\n        </div>\n    ");
    return dot;
}
export function handleKeyboardDelete(event) {
    return __awaiter(this, void 0, void 0, function () {
        var previousState, dotToDelete, urlParts, deleteEvent, error_2, urlParts, xyPlane, restoredDot;
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
                    error_2 = _a.sent();
                    console.error('Failed to process delete:', error_2);
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
export function handleUndo(event) {
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        var lastAction = undoHistory.pop();
        if (!lastAction)
            return;
        var xyPlane = document.getElementById('xy-plane');
        if (!xyPlane)
            return;
        switch (lastAction.type) {
            case 'move':
                if (lastAction.previousState) {
                    var dot = document.querySelector("[data-dot-id=\"".concat(lastAction.dotId, "\"]"));
                    if (dot) {
                        updateDotState(dot, lastAction.previousState);
                        autosaveAfterUndo();
                    }
                }
                break;
            case 'delete':
                if (lastAction.previousState) {
                    var newDot = createDotElement(lastAction.previousState);
                    xyPlane.appendChild(newDot);
                    autosaveAfterUndo();
                }
                break;
            case 'create':
                var dotToRemove = document.querySelector("[data-dot-id=\"".concat(lastAction.dotId, "\"]"));
                if (dotToRemove) {
                    dotToRemove.remove();
                    autosaveAfterUndo();
                }
                break;
        }
    }
}
