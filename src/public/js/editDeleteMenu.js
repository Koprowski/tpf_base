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
import log from "./util.log";
import { dotsSave } from "./dotsSave";
function adjustHoverBox(dotContainer) {
    var labelElement = dotContainer.querySelector('.user-dot-label');
    var coordsElement = dotContainer.querySelector('.dot-coordinates');
    if (!labelElement || !coordsElement)
        return;
    var labelRect = labelElement.getBoundingClientRect();
    var coordsRect = coordsElement.getBoundingClientRect();
    dotContainer.style.setProperty('--hover-top', '-13px');
    dotContainer.style.setProperty('--hover-width', "".concat(Math.max(labelRect.width, coordsRect.width) + 20, "px"));
    dotContainer.style.setProperty('--hover-height', "".concat(coordsRect.bottom - labelRect.top + 7, "px"));
}
export function handleEdit(dotContainer) {
    log('handleEdit');
    var labelElement = dotContainer.querySelector('.user-dot-label');
    if (!labelElement)
        return;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'label-input';
    input.value = labelElement.innerText === 'null' ? '' : labelElement.innerText;
    var labelRect = labelElement.getBoundingClientRect();
    var containerRect = dotContainer.getBoundingClientRect();
    input.style.top = (labelRect.top - containerRect.top) + 'px';
    input.style.left = (labelRect.left - containerRect.left) + 'px';
    var isFinishing = false;
    var isEscPressed = false;
    labelElement.style.visibility = 'hidden';
    function finishEdit() {
        if (isFinishing || isEscPressed)
            return;
        isFinishing = true;
        try {
            var newLabel = input.value || 'null';
            labelElement.innerText = newLabel;
            labelElement.style.visibility = 'visible';
            if (input.parentNode === dotContainer) {
                dotContainer.removeChild(input);
            }
            if (tpf.selectedDot && tpf.selectedDot !== dotContainer) {
                tpf.selectedDot.classList.remove('selected');
                updateCoordinatePrecision(tpf.selectedDot, false);
            }
            tpf.selectedDot = dotContainer;
            dotContainer.classList.add('selected');
            updateCoordinatePrecision(dotContainer, true);
            // Only save if we're not on homepage
            var urlParts = window.location.pathname.split('/');
            if (urlParts.length > 2 && urlParts[1] !== '') {
                requestAnimationFrame(function () {
                    saveDots();
                });
            }
        }
        catch (error) {
            console.error('Error in finishEdit:', error);
            labelElement.style.visibility = 'visible';
        }
        finally {
            isFinishing = false;
        }
    }
    input.addEventListener('blur', function () {
        if (!isEscPressed) {
            requestAnimationFrame(function () {
                finishEdit();
            });
        }
    });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!isFinishing) {
                finishEdit();
            }
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            isEscPressed = true;
            if (input.parentNode === dotContainer) {
                dotContainer.removeChild(input);
            }
            labelElement.style.visibility = 'visible';
        }
    });
    dotContainer.appendChild(input);
    input.focus();
    input.select();
}
export function editDeleteMenu(dot) {
    var _this = this;
    var menu = document.createElement('div');
    menu.className = 'edit-menu';
    menu.style.position = 'absolute';
    var rect = dot.getBoundingClientRect();
    menu.style.left = rect.right + 5 + 'px';
    menu.style.top = rect.top + 'px';
    var deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete';
    deleteOption.onclick = function () { return __awaiter(_this, void 0, void 0, function () {
        var deleteEvent;
        return __generator(this, function (_a) {
            menu.remove();
            dot.remove();
            tpf.selectedDot = null;
            deleteEvent = new CustomEvent('dotDeleted', { bubbles: true });
            document.dispatchEvent(deleteEvent);
            return [2 /*return*/];
        });
    }); };
    menu.appendChild(deleteOption);
    document.body.appendChild(menu);
    // Close menu when clicking outside
    var closeMenu = function (e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(function () {
        document.addEventListener('click', closeMenu);
    }, 0);
}
function updateCoordinatePrecision(dot, highPrecision) {
    var _a, _b;
    var coordsElement = dot.querySelector('.dot-coordinates');
    if (!coordsElement)
        return;
    var coords = ((_b = (_a = coordsElement.textContent) === null || _a === void 0 ? void 0 : _a.match(/-?\d+\.?\d*/g)) === null || _b === void 0 ? void 0 : _b.map(Number)) || [0, 0];
    coordsElement.textContent = "(".concat(coords[0].toFixed(highPrecision ? 2 : 1), ", ").concat(coords[1].toFixed(highPrecision ? 2 : 1), ")");
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
function saveDots() {
    log('saveDots');
    var dots = Array.from(document.getElementsByClassName('dot-container')).map(function (dot) {
        var labelElement = dot.querySelector('.user-dot-label');
        var coordsElement = dot.querySelector('.dot-coordinates');
        var style = dot.style;
        return {
            x: style.left,
            y: style.top,
            coordinates: (coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) || '',
            label: (labelElement === null || labelElement === void 0 ? void 0 : labelElement.textContent) || 'null'
        };
    });
    dotsSave(dots);
}
export { updateCoordinatePrecision, findDotContainer };
