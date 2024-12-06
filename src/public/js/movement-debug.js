// movement-debug.ts
export function captureElementState(element, id) {
    var computed = window.getComputedStyle(element);
    var rect = element.getBoundingClientRect();
    var parent = element.parentElement;
    return {
        id: id,
        rect: rect,
        computedStyle: computed,
        transform: computed.transform,
        position: computed.position,
        left: computed.left,
        top: computed.top,
        parentTransform: parent ? window.getComputedStyle(parent).transform : undefined
    };
}
export function logMovement(event, selectedDot) {
    var _a;
    var coordsElement = selectedDot.querySelector('.dot-coordinates');
    var beforeCoords = (_a = coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) === null || _a === void 0 ? void 0 : _a.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
    var beforeX = beforeCoords ? parseFloat(beforeCoords[1]) : 0;
    var beforeY = beforeCoords ? parseFloat(beforeCoords[2]) : 0;
    return {
        timestamp: Date.now(),
        keyPressed: event.key,
        coordinates: {
            before: { x: beforeX, y: beforeY },
            after: { x: 0, y: 0 }
        }
    };
}
export function updateMovementLog(log, selectedDot) {
    var _a;
    var coordsElement = selectedDot.querySelector('.dot-coordinates');
    var afterCoords = (_a = coordsElement === null || coordsElement === void 0 ? void 0 : coordsElement.textContent) === null || _a === void 0 ? void 0 : _a.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
    var afterX = afterCoords ? parseFloat(afterCoords[1]) : 0;
    var afterY = afterCoords ? parseFloat(afterCoords[2]) : 0;
    log.coordinates.after = { x: afterX, y: afterY };
    return log;
}
function getTransformChain(element) {
    var transforms = [];
    var current = element;
    while (current) {
        var transform = window.getComputedStyle(current).transform;
        if (transform && transform !== 'none') {
            transforms.unshift("".concat(current.className, ": ").concat(transform));
        }
        current = current.parentElement;
    }
    return transforms;
}
function analyzeChanges(before, after) {
    var changes = {};
    for (var _i = 0, _a = Object.entries(before); _i < _a.length; _i++) {
        var _b = _a[_i], elementId = _b[0], beforeState = _b[1];
        var afterState = after[elementId];
        var elementChanges = {};
        // Compare rect properties
        var beforeRect = beforeState.rect;
        var afterRect = afterState.rect;
        if (beforeRect && afterRect) {
            elementChanges.position = {
                left: {
                    before: beforeRect.left,
                    after: afterRect.left,
                    delta: afterRect.left - beforeRect.left
                },
                top: {
                    before: beforeRect.top,
                    after: afterRect.top,
                    delta: afterRect.top - beforeRect.top
                },
                didMove: afterRect.left !== beforeRect.left || afterRect.top !== beforeRect.top
            };
        }
        // Compare computed styles
        var beforeComputed = beforeState.computedStyle;
        var afterComputed = afterState.computedStyle;
        elementChanges.styles = {
            transform: {
                before: beforeComputed.transform,
                after: afterComputed.transform,
                changed: beforeComputed.transform !== afterComputed.transform
            },
            position: {
                before: beforeComputed.position,
                after: afterComputed.position,
                changed: beforeComputed.position !== afterComputed.position
            },
            top: {
                before: beforeComputed.top,
                after: afterComputed.top,
                changed: beforeComputed.top !== afterComputed.top
            },
            left: {
                before: beforeComputed.left,
                after: afterComputed.left,
                changed: beforeComputed.left !== afterComputed.left
            }
        };
        if (Object.keys(elementChanges).length > 0) {
            changes[elementId] = elementChanges;
        }
    }
    return changes;
}
function compareTransforms(before, after) {
    var transformAnalysis = {
        added: after.filter(function (t) { return !before.includes(t); }),
        removed: before.filter(function (t) { return !after.includes(t); }),
        changed: after.filter(function (t, i) { return before[i] !== t; }),
        complete: {
            before: before.join(' → '),
            after: after.join(' → '),
            chainChanged: before.join('') !== after.join('')
        }
    };
    // Add matrix decomposition if transforms changed
    if (transformAnalysis.changed.length > 0) {
        transformAnalysis.decomposition = {
            before: before.map(function (t) { return decomposeTransform(t); }),
            after: after.map(function (t) { return decomposeTransform(t); })
        };
    }
    return transformAnalysis;
}
function decomposeTransform(transform) {
    var match = transform.match(/(matrix|translate|scale|rotate)\((.*?)\)/);
    if (!match)
        return { type: 'none' };
    var _ = match[0], type = match[1], values = match[2];
    var nums = values.split(',').map(Number);
    switch (type) {
        case 'matrix':
            return {
                type: 'matrix',
                values: nums,
                scale: Math.sqrt(nums[0] * nums[0] + nums[1] * nums[1]),
                rotation: Math.atan2(nums[1], nums[0]) * (180 / Math.PI),
                translation: {
                    x: nums[4],
                    y: nums[5]
                }
            };
        case 'translate':
            return {
                type: 'translate',
                x: nums[0],
                y: nums[1] || 0
            };
        default:
            return {
                type: type,
                values: nums
            };
    }
}
