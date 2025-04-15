import { getUrlParameter } from '../../utils/url';

/**
 * Extracts a site key from a captcha element's URL search parameters.
 *
 * @param {Object} options - The options object
 * @param {HTMLElement | null} options.captchaElement - The DOM element containing the captcha
 * @param {string} options.siteKeyAttrName - The name of the search parameter containing the site key
 * @returns {string | null} The site key extracted from the captcha element's URL or null if not found
 * @throws {Error}
 */
export function getSiteKeyFromSearchParam({ captchaElement, siteKeyAttrName }) {
    if (!captchaElement) {
        throw Error('[getSiteKeyFromSearchParam] could not find captcha');
    }

    if (!('src' in captchaElement)) {
        throw Error('[getSiteKeyFromSearchParam] missing src attribute');
    }

    return getUrlParameter(String(captchaElement.src), siteKeyAttrName);
}

/**
 * Extracts a site key from a captcha container element's attributes.
 *
 * @param {Object} options - The options object
 * @param {HTMLElement | null} options.captchaContainerElement - The DOM element containing the captcha
 * @param {string} options.siteKeyAttrName - The name of the attribute containing the site key
 * @returns {string} The site key extracted from the captcha element's attributes
 * @throws {Error}
 */
export function getSiteKeyFromAttribute({ captchaContainerElement, siteKeyAttrName }) {
    if (!captchaContainerElement) {
        throw Error('[getSiteKeyFromAttribute] could not find captcha container');
    }

    const siteKey = captchaContainerElement.getAttribute(siteKeyAttrName);
    if (!siteKey) {
        throw Error(`[getSiteKeyFromAttribute] missing ${siteKeyAttrName} attribute`);
    }

    return siteKey;
}
