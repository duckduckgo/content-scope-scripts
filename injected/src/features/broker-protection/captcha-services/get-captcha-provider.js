import { captchaFactory } from './providers';

/**
 * Gets the captcha provider for the getCaptchaInfo action
 *
 * @param {HTMLElement} captchaDiv
 * @param {string} captchaType
 * @return {import('./providers/provider.interface.js').CaptchaProvider}
 * @throws {Error}
 */
export const getCaptchaProvider = (captchaDiv, captchaType) => {
    const captchaProvider = captchaFactory.getProviderByType(captchaType);
    if (!captchaProvider) {
        throw new Error(`[getCaptchaProvider] could not find captchaProvider with type ${captchaType}`);
    }

    if (captchaProvider.isSupportedForElement(captchaDiv)) {
        return captchaProvider;
    }

    // TODO fire a pixel
    // if the captcha provider type is different from the expected type, log a warning
    console.warn(
        `[getCaptchaProvider] mismatch between expected captha type ${captchaType} and detected type ${captchaProvider.getType()}`,
    );
    const detectedProvider = captchaFactory.detectProvider(captchaDiv);
    if (!detectedProvider) {
        throw new Error(`[getCaptchaProvider] could not detect captcha provider for ${captchaType} captcha and element ${captchaDiv}`);
    }

    return detectedProvider;
};

/**
 * Gets the captcha provider for the solveCaptcha action
 * @param {Document} root
 * @param {string} captchaType
 * @return {import('./providers/provider.interface.js').CaptchaProvider}
 * @throws {Error}
 */
export const getCaptchaSolveProvider = (root, captchaType) => {
    const captchaProvider = captchaFactory.getProviderByType(captchaType);
    if (!captchaProvider) {
        throw new Error(`[getCaptchaSolveProvider] could not find captchaProvider with type ${captchaType}`);
    }

    if (captchaProvider.canSolve(root)) {
        return captchaProvider;
    }

    // TODO fire a pixel
    // if the captcha provider type is different from the expected type, log a warning
    console.warn(
        `[getCaptchaSolveProvider] mismatch between expected captha type ${captchaType} and detected type ${captchaProvider.getType()}`,
    );
    const detectedProvider = captchaFactory.detectSolveProvider(root);
    if (!detectedProvider) {
        throw new Error(`[getCaptchaSolveProvider] could not detect captcha provider for ${captchaType} captcha and element ${root}`);
    }

    return detectedProvider;
};
