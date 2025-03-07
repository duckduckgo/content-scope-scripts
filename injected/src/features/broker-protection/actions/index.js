import { extract } from './extract.js';
import { fillForm } from './fill-form.js';
import { click } from './click.js';
import { expectation } from './expectation.js';
import { navigate } from './navigate';
import { buildUrl } from './build-url';
import * as captchaHandlers from '../captcha-services';
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
