import { extract } from './extract';
import { fillForm } from './fill-form';
import { click } from './click';
import { expectation } from './expectation';
import { navigate } from './navigate';
import { buildUrl } from './build-url';
import * as captchaHandlers from '../captcha-services/captcha.service';
import * as deprecatedCaptchaHandlers from './captcha-deprecated';

/**
 * Returns the captcha handlers based on the useEnhancedCaptchaSystem flag
 * @param {Object} params
 * @param {boolean} params.useEnhancedCaptchaSystem
 */
export function resolveActionHandlers({ useEnhancedCaptchaSystem }) {
    useEnhancedCaptchaSystem = true;
    return {
        extract,
        fillForm,
        click,
        expectation,
        ...(useEnhancedCaptchaSystem
            ? {
                  navigate,
                  ...captchaHandlers,
              }
            : {
                  navigate: buildUrl,
                  ...deprecatedCaptchaHandlers,
              }),
    };
}
