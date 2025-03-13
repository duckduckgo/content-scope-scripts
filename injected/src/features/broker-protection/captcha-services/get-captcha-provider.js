import { PirError } from '../types';
import { captchaFactory } from './providers/registry';

/**
 * Gets the captcha provider for the getCaptchaInfo action
 *
 * @param {HTMLElement} captchaDiv
 * @param {string} captchaType
 */
export function getCaptchaProvider(captchaDiv, captchaType) {
    const captchaProvider = captchaFactory.getProviderByType(captchaType);
    if (!captchaProvider) {
        return PirError.create(`[getCaptchaProvider] could not find captchaProvider with type ${captchaType}`);
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
        return PirError.create(
            `[getCaptchaProvider] could not detect captcha provider for ${captchaType} captcha and element ${captchaDiv}`,
        );
    }

    return detectedProvider;
}

/**
 * Gets the captcha provider for the solveCaptcha action
 * @param {Document} root
 * @param {string} captchaType
 */
export function getCaptchaSolveProvider(root, captchaType) {
    const captchaProvider = captchaFactory.getProviderByType(captchaType);
    if (!captchaProvider) {
        return PirError.create(`[getCaptchaSolveProvider] could not find captchaProvider with type ${captchaType}`);
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
        return PirError.create(
            `[getCaptchaSolveProvider] could not detect captcha provider for ${captchaType} captcha and element ${root}`,
        );
    }

    return detectedProvider;
}
