/**
 * @typedef {import('./types/detection.types.js').InterferenceConfig} InterferenceConfig
 */

/**
 * @type {InterferenceConfig}
 */
export const DEFAULT_INTERFERENCE_CONFIG = Object.freeze(
    /** @type {InterferenceConfig} */ ({
        settings: {
            botDetection: {
                cloudflareTurnstile: {
                    state: 'enabled',
                    vendor: 'cloudflare',
                    selectors: ['.cf-turnstile', 'script[src*="challenges.cloudflare.com"]'],
                    windowProperties: ['turnstile'],
                    statusSelectors: [
                        {
                            status: 'solved',
                            selectors: ['[data-state="success"]'],
                        },
                        {
                            status: 'failed',
                            selectors: ['[data-state="error"]'],
                        },
                    ],
                },
                cloudflareChallengePage: {
                    state: 'enabled',
                    vendor: 'cloudflare',
                    selectors: ['#challenge-form', '.cf-browser-verification', '#cf-wrapper', 'script[src*="challenges.cloudflare.com"]'],
                    windowProperties: ['_cf_chl_opt', '__CF$cv$params', 'cfjsd'],
                },
                hcaptcha: {
                    state: 'enabled',
                    vendor: 'hcaptcha',
                    selectors: [
                        '.h-captcha',
                        '[data-hcaptcha-widget-id]',
                        'script[src*="hcaptcha.com"]',
                        'script[src*="assets.hcaptcha.com"]',
                    ],
                    windowProperties: ['hcaptcha'],
                },
            },
            fraudDetection: {
                phishingWarning: {
                    state: 'enabled',
                    type: 'phishing',
                    selectors: ['.warning-banner', '#security-alert'],
                    textPatterns: ['suspicious.*activity', 'unusual.*login', 'verify.*account'],
                    textSources: ['innerText'],
                },
                accountSuspension: {
                    state: 'enabled',
                    type: 'suspension',
                    selectors: ['.account-suspended', '#suspension-notice'],
                    textPatterns: ['account.*suspended', 'access.*restricted'],
                    textSources: ['innerText'],
                },
            },
            youtubeAds: {
                rootSelector: '#movie_player',
                watchAttributes: ['class', 'style', 'aria-label'],
                selectors: ['.ytp-ad-text', '.ytp-ad-skip-button', '.ytp-ad-preview-text'],
                adClasses: ['ad-showing', 'ad-interrupting'],
                textPatterns: ['skip ad', 'sponsored'],
                textSources: ['innerText', 'ariaLabel'],
                pollInterval: 2000,
                rerootInterval: 1000,
            },
        },
    }),
);
