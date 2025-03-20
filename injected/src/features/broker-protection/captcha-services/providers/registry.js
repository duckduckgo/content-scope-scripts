import { CaptchaFactory } from '../factory';
import { CloudFlareTurnstileProvider } from './cloudflare-turnstile';
import { ReCaptchaProvider } from './recaptcha';

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

captchaFactory.registerProvider(
    new CloudFlareTurnstileProvider({
        type: 'cloudflareTurnstile',
        providerUrl: 'https://challenges.cloudflare.com',
        responseElementName: 'cf-turnstile-response',
    }),
);

export { captchaFactory };
