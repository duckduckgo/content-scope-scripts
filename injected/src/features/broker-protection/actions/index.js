import { extract } from './extract';
import { fillForm } from './fill-form';
import { click } from './click';
import { expectation } from './expectation';
import { navigate } from './navigate';
import { buildUrl } from './build-url';
import * as captchaHandlers from '../captcha-services/captcha.service';
import * as deprecatedCaptchaHandlers from './captcha-deprecated';

/**
 * Returns the captcha handlers based on the useNewActionHandlers flag
 * @param {Object} params
 * @param {boolean} params.useNewActionHandlers
 */
export const resolveActionHandlers = ({ useNewActionHandlers }) => {
    return {
        extract,
        fillForm,
        click,
        expectation,
        ...(useNewActionHandlers
            ? {
                  navigate,
                  ...captchaHandlers,
              }
            : {
                  navigate: buildUrl,
                  ...deprecatedCaptchaHandlers,
              }),
    };
};
