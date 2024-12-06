export function initErrorTracker() {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        var errorDiv = document.createElement('div');
        errorDiv.style.cssText = "\n            position: fixed;\n            bottom: 20px;\n            right: 20px;\n            max-width: 500px;\n            background: white;\n            border: 2px solid red;\n            padding: 15px;\n            border-radius: 5px;\n            z-index: 9999;\n            font-family: monospace;\n            font-size: 12px;\n        ";
        errorDiv.innerHTML = "\n            <strong>Error:</strong> ".concat(msg, "<br>\n            <strong>File:</strong> ").concat(url, "<br>\n            <strong>Line:</strong> ").concat(lineNo, ", Column: ").concat(columnNo, "<br>\n            ").concat((error === null || error === void 0 ? void 0 : error.stack) ? "<strong>Stack:</strong><br>".concat(error.stack.replace(/\n/g, '<br>')) : '', "\n        ");
        document.body.appendChild(errorDiv);
        // Remove after 10 seconds
        setTimeout(function () { return errorDiv.remove(); }, 10000);
        return false;
    };
}
