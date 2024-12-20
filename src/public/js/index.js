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
import { createTickMarks, pixelToCoordinate, coordinateToPixel } from './createTickMarks';
import { tpf } from './data';
import { dotsCreate } from './dotsCreate';
import { dotsLoad } from './dotsLoad';
import { dotsSave } from './dotsSave';
import { mouseDown, mouseUp, mouseMove } from './mouseEvents';
import { removeAnyExistingElementsWithClassName } from './removeAnyExistingElementsWithClassName';
import log from './util.log';
import { initErrorTracker } from './errorTracker';
import './navScroll';
// Export everything that needs to be globally available
window.createTickMarks = createTickMarks;
window.pixelToCoordinate = pixelToCoordinate;
window.coordinateToPixel = coordinateToPixel;
window.dotsCreate = dotsCreate;
window.dotsLoad = dotsLoad;
window.dotsSave = dotsSave;
window.mouseDown = mouseDown;
window.mouseUp = mouseUp;
window.mouseMove = mouseMove;
window.removeAnyExistingElementsWithClassName = removeAnyExistingElementsWithClassName;
window.log = log;
window.tpf = tpf;
// Initialize grid when the document loads
document.addEventListener('DOMContentLoaded', function () {
    initErrorTracker();
    log('Document loaded, initializing grid...');
    // Initialize grid
    var xyPlane = document.getElementById('xy-plane');
    if (xyPlane) {
        log('Found xy-plane, creating tick marks...');
        try {
            // Global click tracker
            document.addEventListener('click', function (e) {
            }, true); // Use capture phase to see the event first
            // Create the tick marks first
            createTickMarks(xyPlane);
            log('Tick marks created successfully');
            // Then initialize dots functionality
            dotsCreate();
            log('Dots functionality initialized');
            // Add mouse event listeners
            xyPlane.addEventListener('mousedown', mouseDown);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('mousemove', mouseMove);
            // Prevent default context menu
            xyPlane.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            });
            // Add event listeners for label input
            var labelInputs = document.querySelectorAll('.label-input');
            labelInputs.forEach(function (labelInput) {
                labelInput.addEventListener('focus', function () {
                    var dotContainer = labelInput.closest('.dot-container');
                    if (dotContainer) {
                        dotContainer.classList.add('editing');
                    }
                });
                labelInput.addEventListener('blur', function () {
                    var dotContainer = labelInput.closest('.dot-container');
                    if (dotContainer) {
                        dotContainer.classList.remove('editing');
                    }
                });
                labelInput.addEventListener('keydown', function (event) {
                    var keyboardEvent = event;
                    var key = keyboardEvent.key;
                    if (key === 'Enter') {
                        var dotContainer = labelInput.closest('.dot-container');
                        if (dotContainer) {
                            dotContainer.classList.add('selected');
                        }
                    }
                });
            });
        }
        catch (error) {
            console.error('Error initializing grid:', error);
        }
    }
    else {
        console.error('Could not find xy-plane element');
    }
    // Handle form submission
    var savePageForm = document.getElementById('savePageForm');
    if (savePageForm) {
        savePageForm.addEventListener('submit', function (e) {
            return __awaiter(this, void 0, void 0, function () {
                var pageName, dots, response, errorData, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            e.preventDefault();
                            pageName = document.getElementById('pageName');
                            if (!pageName.value) {
                                alert('Please enter a page name');
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
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
                            return [4 /*yield*/, fetch('/api/pages/save', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        title: pageName.value,
                                        content: pageName.value,
                                        dots: dots
                                    })
                                })];
                        case 2:
                            response = _a.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.json()];
                        case 3:
                            errorData = _a.sent();
                            throw new Error(errorData.error || 'Failed to save page');
                        case 4: return [4 /*yield*/, response.json()];
                        case 5:
                            result = _a.sent();
                            console.log('Page saved successfully:', result);
                            window.location.href = '/dashboard';
                            return [3 /*break*/, 7];
                        case 6:
                            error_1 = _a.sent();
                            console.error('Error saving page:', error_1);
                            if (error_1 instanceof Error) {
                                alert("Error saving page: ".concat(error_1.message));
                            }
                            else {
                                alert('Error saving page. Please try again.');
                            }
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        });
    }
    // Initialize any saved dots if they exist
    try {
        // Only try to load dots if we're not on the homepage
        var urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] !== '') {
            dotsLoad();
        }
    }
    catch (error) {
        var urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] !== '') {
            console.error('Error loading saved dots:', error);
        }
    }
});
// Clean up function to remove event listeners when needed
function cleanup() {
    var xyPlane = document.getElementById('xy-plane');
    if (xyPlane) {
        xyPlane.removeEventListener('mousedown', mouseDown);
        window.removeEventListener('mouseup', mouseUp);
        window.removeEventListener('mousemove', mouseMove);
    }
}
// Export functions for use in other modules if needed
export { createTickMarks, pixelToCoordinate, coordinateToPixel, dotsCreate, dotsLoad, dotsSave, mouseDown, mouseUp, mouseMove, removeAnyExistingElementsWithClassName, log, cleanup };
