const TURNSTILE_SELECTORS = ['.cf-turnstile'];
const TURNSTILE_WINDOW_OBJECTS = ['turnstile'];

const CHALLENGE_PAGE_SELECTORS = ['#challenge-form', '.cf-browser-verification', '#cf-wrapper'];
const CHALLENGE_PAGE_WINDOW_OBJECTS = ['_cf_chl_opt', '__CF$cv$params', 'cfjsd'];

export function detectCloudflareTurnstile() {
    const hasDOM = TURNSTILE_SELECTORS.some((selector) => document.querySelector(selector));
    const hasWindowObjects = TURNSTILE_WINDOW_OBJECTS.some((object) => typeof window[object] !== 'undefined');
    const detected = hasDOM || hasWindowObjects;

    return {
        detected,
        vendor: 'cloudflare',
        challengeType: 'turnstile',
    };
}

export function detectCloudflareChallengePage() {
    const hasDOM = CHALLENGE_PAGE_SELECTORS.some((selector) => document.querySelector(selector));
    const hasWindowObjects = CHALLENGE_PAGE_WINDOW_OBJECTS.some((object) => typeof window[object] !== 'undefined');
    const detected = hasDOM || hasWindowObjects;

    return {
        detected,
        vendor: 'cloudflare',
        challengeType: 'challenge_page',
    };
}
