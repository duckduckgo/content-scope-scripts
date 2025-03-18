import { CaptchaFactory } from '../factory';
import { ReCaptchaProvider } from './recaptcha';
import { HCaptchaProvider } from './hcaptcha';

const captchaFactory = new CaptchaFactory();

captchaFactory.registerProvider(
    new ReCaptchaProvider({
        type: 'recaptcha2',
        providerUrl: 'https://www.google.com/recaptcha/api2',
        responseElementName: 'g-recaptcha-response',
    }),
);

captchaFactory.registerProvider(
    new ReCaptchaProvider({
        type: 'recaptchaEnterprise',
        providerUrl: 'https://www.google.com/recaptcha/enterprise',
        responseElementName: 'g-recaptcha-response',
    }),
);

captchaFactory.registerProvider(new HCaptchaProvider());

export { captchaFactory };
