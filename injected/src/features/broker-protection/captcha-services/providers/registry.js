import { CaptchaFactory } from '../factory';
import { ReCaptchaProvider } from './recaptcha';
import { ImageProvider } from './image';
import { CloudFlareTurnstileProvider } from './cloudflare-turnstile';

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

captchaFactory.registerProvider(new CloudFlareTurnstileProvider());
// 'llm-prompt' has no image to extract (see ../prompt.js), but its answer is typed into an input
// just like an image captcha's, so it shares the image provider's solve path.
captchaFactory.registerProvider(new ImageProvider(), { aliases: ['red-circle', 'basic-math', 'llm-prompt'] });

export { captchaFactory };
