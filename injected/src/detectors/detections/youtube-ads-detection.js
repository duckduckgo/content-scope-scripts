import { isVisible, queryAllSelectors } from '../utils/detection-utils.js';
const DEFAULT_CONFIG = {
    rootSelector: '#movie_player',
    adClasses: ['ad-showing', 'ad-interrupting'],
    selectors: ['.ytp-ad-text', '.ytp-ad-skip-button', '.ytp-ad-preview-text'],
};

export function createYouTubeAdsDetector(config = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    return {
        async getData() {
            return runYouTubeAdsDetection(mergedConfig);
        },
    };
}

export function runYouTubeAdsDetection(config = DEFAULT_CONFIG) {
    const root = document.querySelector(config.rootSelector);
    if (!root) {
        return emptyResult();
    }

    const hasAdClass = config.adClasses.some((cls) => root.classList.contains(cls));
    const adElements = queryAllSelectors(config.selectors, root);
    const hasVisibleAdElement = adElements.some((el) => isVisible(el));

    const detected = hasAdClass || hasVisibleAdElement;

    return detected
        ? {
              detected: true,
              type: 'youtubeAds',
              results: [
                  {
                      adCurrentlyPlaying: true,
                      adType: 'video-ad',
                      source: 'snapshot',
                  },
              ],
              timestamp: Date.now(),
          }
        : emptyResult();
}

function emptyResult() {
    return {
        detected: false,
        type: 'youtubeAds',
        results: [],
        timestamp: Date.now(),
    };
}
