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
import { editDeleteMenu } from "./editDeleteMenu";
import log from "./util.log";
import { mouseDown, mouseUp, mouseMove } from "./mouseEvents";
export function dotsLoad() {
    return __awaiter(this, void 0, void 0, function () {
        var existingDots, urlParts, urlId, response, dots, xyPlane_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('loadDots');
                    existingDots = document.getElementsByClassName('dot-container');
                    while (existingDots.length > 0) {
                        existingDots[0].remove();
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    urlParts = window.location.pathname.split('/');
                    urlId = urlParts[urlParts.length - 1];
                    return [4 /*yield*/, fetch("/api/pages/".concat(urlId, "/dots"))];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to load dots');
                    return [4 /*yield*/, response.json()];
                case 3:
                    dots = _a.sent();
                    // Create dots on the page
                    if (dots && dots.length > 0) {
                        xyPlane_1 = document.getElementById("xy-plane");
                        if (!xyPlane_1)
                            return [2 /*return*/];
                        dots.forEach(function (savedDot) {
                            var dot = createDot(savedDot);
                            xyPlane_1.appendChild(dot);
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error loading dots:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function createDot(savedDot) {
    var dot = document.createElement("div");
    dot.classList.add("dot-container");
    dot.style.left = savedDot.x;
    dot.style.top = savedDot.y;
    dot.innerHTML = "\n        <div class='dot'></div>\n        <div class='coordinate-text'>\n            <div class='user-dot-label' style='top:-6px'>".concat(savedDot.label, "</div>\n            <div class='dot-coordinates'>").concat(savedDot.coordinates, "</div>\n        </div>\n    ");
    // Add event listeners
    dot.addEventListener("contextmenu", handleContextMenu);
    dot.addEventListener('mousedown', mouseDown);
    dot.addEventListener('mouseup', mouseUp);
    window.addEventListener('mousemove', mouseMove, false);
    return dot;
}
function handleContextMenu(event) {
    log('dot.contextmenu');
    event.preventDefault();
    // Remove any existing menus
    var existingMenus = document.getElementsByClassName('edit-menu');
    while (existingMenus.length > 0) {
        existingMenus[0].remove();
    }
    // Show menu for this dot
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          