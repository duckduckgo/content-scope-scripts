import { sjcl } from '../lib/sjcl.js';

/**
 * @param {string} sessionKey
 * @param {string} domainKey
 * @param {string | number} inputData
 * @returns {string}
 */
export function getDataKeySync(sessionKey, domainKey, inputData) {
    // eslint-disable-next-line new-cap
    const hmac = new /** @type {any} */ (sjcl).misc.hmac(
        /** @type {any} */ (sjcl).codec.utf8String.toBits(sessionKey + domainKey),
        /** @type {any} */ (sjcl).hash.sha256,
    );
    return /** @type {string} */ (/** @type {any} */ (sjcl).codec.hex.fromBits(hmac.encrypt(inputData)));
}
