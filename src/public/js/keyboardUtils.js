// Throttle function to limit rate of updates
export function throttle(func, limit) {
    var inThrottle;
    var lastFunc;
    var lastRan;
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(this, args);
            lastRan = Date.now();
            inThrottle = true;
        }
        else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(_this, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}
// Debounce function to delay execution
export function debounce(func, wait) {
    var timeout;
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var later = function () {
            clearTimeout(timeout);
            func.apply(_this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
