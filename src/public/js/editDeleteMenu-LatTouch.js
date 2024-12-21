import log from "./util.log";
import { recordDotState, addToUndoHistory, tpf } from './data';
import { dotsSave, autosaveDots } from './dotsSave';
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
    var menu = document.createElement('div');
    menu.className = 'edit-menu';
    menu.style.position = 'absolute';
    var deleteDots = function () {
        // Create a Set to handle unique dots to delete
        var dotsToDelete = new Set();
        // Add all multi-selected dots
        document.querySelectorAll('.dot-container.multi-selected').forEach(function (d) { return dotsToDelete.add(d); });
        // Add any single-selected dots
        document.querySelectorAll('.dot-container.selected').forEach(function (d) { return dotsToDelete.add(d); });
        // Add the right-clicked dot if not already included
        dotsToDelete.add(dot);
        // If we have dots to delete, process them
        if (dotsToDelete.size > 0) {
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
        }
        // Clean up menu
        menu.remove();
        // Clear selection tracking
        tpf.selectedDot = null;
        // Trigger autosave
        var urlParts = window.location.pathname.split('/');
        if (urlParts.length > 2 && urlParts[1] !== '') {
            autosaveDots();
        }
    };
    menu.innerHTML = "\n        <div class=\"delete\">Delete</div>\n    ";
    // Position menu near the cursor
    var rect = dot.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = rect.bottom + 'px';
    // Add click handlers
    var deleteButton = menu.querySelector('.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', deleteDots);
    }
    // Add menu to document
    document.body.appendChild(menu);
    // Remove menu when clicking outside
    var removeMenu = function (e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', removeMenu);
        }
    };
    // Delay adding click listener to prevent immediate removal
    setTimeout(function () {
        document.addEventListener('click', removeMenu);
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
