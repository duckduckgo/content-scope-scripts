const DOM_SELECTORS = ['.h-captcha', '[data-hcaptcha-widget-id]'];
const SCRIPT_DOMAINS = ['hcaptcha.com', 'assets.hcaptcha.com'];
const WINDOW_OBJECTS = ['hcaptcha'];

function detectDOM() {
    return DOM_SELECTORS.some((selector) => document.querySelector(selector));
}

function detectScripts() {
    return SCRIPT_DOMAINS.some((domain) => document.querySelectorAll(`script[src*="${domain}"]`).length > 0);
}

function detectWindowObjects() {
    return WINDOW_OBJECTS.some((object) => typeof window[object] !== 'undefined');
}

export function detectHCaptcha() {
    const detected = detectDOM() || detectScripts() || detectWindowObjects();

    return {
        detected,
        vendor: 'hcaptcha',
        challengeType: 'widget'
    };
}
