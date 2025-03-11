import { CaptchaFactory } from '../factory';
import { ReCaptchaV2Provider } from './recaptcha-v2';
import { ReCaptchaEnterpriseProvider } from './recaptcha-enterprise';
import { CloudFlareTurnstileProvider } from './cloudflare-turnstile';
import { HCaptchaProvider } from './hcaptcha';

const captchaFactory = new CaptchaFactory();

captchaFactory.registerProvider(ReCaptchaV2Provider);
captchaFactory.registerProvider(ReCaptchaEnterpriseProvider);
captchaFactory.registerProvider(CloudFlareTurnstileProvider);
captchaFactory.registerProvider(HCaptchaProvider);

export { captchaFactory };
