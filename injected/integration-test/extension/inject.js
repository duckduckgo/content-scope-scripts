function injectContentScript(src) {
    const elem = document.head || document.documentElement;
    const script = document.createElement('script');
    script.src = src;
    script.onload = function () {
        this.remove();
    };
    elem.appendChild(script);
}

// CSP-safe status signaling: Use DOM attributes instead of window.__content_scope_status
// This avoids eval() which is blocked by strict CSP
function pollForStatus() {
    const checkInterval = setInterval(() => {
        if (window.__content_scope_status === 'loaded') {
            document.documentElement.setAttribute('data-content-scope-loaded', 'true');
        }
        if (window.__content_scope_status === 'initialized') {
            document.documentElement.setAttribute('data-content-scope-initialized', 'true');
            clearInterval(checkInterval);
        }
    }, 50); // Check every 50ms
    
    // Safety timeout
    setTimeout(() => clearInterval(checkInterval), 30000);
}

injectContentScript(chrome.runtime.getURL('/contentScope.js'));
pollForStatus();
