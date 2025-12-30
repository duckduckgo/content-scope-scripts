function injectContentScript(src) {
    const elem = document.head || document.documentElement;
    const script = document.createElement('script');
    script.src = src;
    script.onload = function () {
        this.remove();
    };
    elem.appendChild(script);
}

// CSP-safe status signaling: Use CustomEvent only
// This avoids eval() which is blocked by strict CSP
function setupStatusSignaling() {
    const checkInterval = setInterval(() => {
        if (window.__content_scope_status === 'loaded') {
            document.dispatchEvent(new CustomEvent('content-scope-loaded'));
        }
        if (window.__content_scope_status === 'initialized') {
            document.dispatchEvent(new CustomEvent('content-scope-initialized'));
            clearInterval(checkInterval);
        }
    }, 50); // Check every 50ms
    
    // Safety timeout
    setTimeout(() => clearInterval(checkInterval), 30000);
}

injectContentScript(chrome.runtime.getURL('/contentScope.js'));
setupStatusSignaling();
