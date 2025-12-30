function injectContentScript(src) {
    const elem = document.head || document.documentElement;
    const script = document.createElement('script');
    script.src = src;
    script.onload = function () {
        this.remove();
    };
    elem.appendChild(script);
}

// CSP-safe status signaling: Use CustomEvent + meta tag markers
// This avoids eval() which is blocked by strict CSP
function setupStatusSignaling() {
    const checkInterval = setInterval(() => {
        if (window.__content_scope_status === 'loaded') {
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('content-scope-loaded'));
            // Add meta tag marker for CSP-safe detection via waitForSelector
            const meta = document.createElement('meta');
            meta.name = 'content-scope-loaded';
            meta.content = 'true';
            document.head.appendChild(meta);
        }
        if (window.__content_scope_status === 'initialized') {
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('content-scope-initialized'));
            // Add meta tag marker
            const meta = document.createElement('meta');
            meta.name = 'content-scope-initialized';
            meta.content = 'true';
            document.head.appendChild(meta);
            clearInterval(checkInterval);
        }
    }, 50); // Check every 50ms
    
    // Safety timeout
    setTimeout(() => clearInterval(checkInterval), 30000);
}

injectContentScript(chrome.runtime.getURL('/contentScope.js'));
setupStatusSignaling();
