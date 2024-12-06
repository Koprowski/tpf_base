export function initErrorTracker() {
    window.onerror = (msg, url, lineNo, columnNo, error) => {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            max-width: 500px;
            background: white;
            border: 2px solid red;
            padding: 15px;
            border-radius: 5px;
            z-index: 9999;
            font-family: monospace;
            font-size: 12px;
        `;
        
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${msg}<br>
            <strong>File:</strong> ${url}<br>
            <strong>Line:</strong> ${lineNo}, Column: ${columnNo}<br>
            ${error?.stack ? `<strong>Stack:</strong><br>${error.stack.replace(/\n/g, '<br>')}` : ''}
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 10 seconds
        setTimeout(() => errorDiv.remove(), 10000);
        
        return false;
    };
}