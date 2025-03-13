import { extract } from './extract';
import { fillForm } from './fill-form';
import { click } from './click';
import { expectation } from './expectation';
import { navigate } from './navigate';
import { buildUrl } from './build-url';
import * as captchaHandlers from '../captcha-services/captcha.service';
import * as deprecatedCaptchaHandlers from './captcha-deprecated';

/**
 * Returns the captcha handlers based on the useWebViewActionsV2 flag
 * @param {Object} params
 * @param {boolean} params.useWebViewActionsV2
 */
export function resolveActionHandlers({ useWebViewActionsV2 }) {
    return {
        extract,
        fillForm,
        click,
        expectation,
        ...(useWebViewActionsV2
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
