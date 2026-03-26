import ContentFeature from '../content-feature';

/**
 * Privacy Pass ACT (Anonymous Credit Tokens) feature stub.
 *
 * Privacy Pass operates at the HTTP layer (RFC 9577), not the DOM layer.
 * The browser's native network stack intercepts `WWW-Authenticate: PrivateToken`
 * challenges in 401 responses and runs the ACT issuance/spending protocol
 * (draft-schlesinger-privacypass-act) with the issuer.
 *
 * This C-S-S feature exists solely as a configuration anchor — when the
 * `privacyPass` feature is enabled in remote config, native interceptors
 * activate. No JavaScript API is exposed because the protocol is transparent
 * to web content.
 *
 * @see https://datatracker.ietf.org/doc/draft-schlesinger-privacypass-act/
 * @see https://www.rfc-editor.org/rfc/rfc9577 (Privacy Pass HTTP Authentication Scheme)
 */
export default class PrivacyPass extends ContentFeature {
    init() {
        // Privacy Pass is handled entirely at the native HTTP layer.
        // This feature stub exists for remote config feature-flag gating.
    }
}
