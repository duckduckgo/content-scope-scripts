import { ReCaptchaV2Provider } from './recaptcha-v2';

export class ReCaptchaEnterpriseProvider extends ReCaptchaV2Provider {
    getType() {
        return 'recaptchaEnterprise';
    }

    getCaptchaProviderUrl() {
        return 'https://www.google.com/recaptcha/enterprise';
    }

    getCaptchaResponseElementName() {
        return 'g-recaptcha-response';
    }
}
