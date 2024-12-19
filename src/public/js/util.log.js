// util.log.ts
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var ENABLED_CATEGORIES = [
//'mouse',
//'keyboard',
//'debug',
//'general',
//'dots'  // Enable all categories for debugging
];
export default function log(message, category) {
    if (category === void 0) { category = 'general'; }
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    try {
        if (ENABLED_CATEGORIES.includes(category)) {
            console.log.apply(console, __spreadArray(["[".concat(category, "]"), message], args, false));
        }
    }
    catch (error) {
        // Silently fail
    }
}
