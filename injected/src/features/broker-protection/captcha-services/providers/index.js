import { CaptchaFactory } from '../factory';
import { ReCaptchaV2Provider } from './recaptcha-v2';
import { CloudFlareTurnstileProvider } from './cloudflare-turnstile';
import { HCaptchaProvider } from './hcaptcha';

const captchaFactory = new CaptchaFactory();

captchaFactory.registerProvider(new ReCaptchaV2Provider({}));
captchaFactory.registerProvider(
    new ReCaptchaV2Provider({
        type: 'recaptchaEnterprise',
        providerUrl: 'https://www.google.com/recaptcha/enterprise',
        responseElementName: 'g-recaptcha-response',
    }),
);
captchaFactory.registerProvider(new CloudFlareTurnstileProvider());
captchaFactory.registerProvider(new HCaptchaProvider());

export { captchaFactory };
