import ContentFeature from '../content-feature';

/**
 * @typedef {object} IssueParams
 * @property {string} issuer - The issuer origin
 * @property {number} credits - Number of credits to issue
 */

/**
 * @typedef {object} IssueResult
 * @property {string} credentialId - The new credential identifier
 * @property {number} credits - Number of credits in the credential
 */

/**
 * @typedef {object} SpendParams
 * @property {string} credentialId - Credential to spend from
 * @property {number} amount - Number of credits to spend
 */

/**
 * @typedef {object} SpendResult
 * @property {string} credentialId - New credential identifier (old is invalidated)
 * @property {number} remainingCredits - Credits remaining after spend
 * @property {string} token - Redemption token for the spent credits
 */

/**
 * @typedef {object} BalanceParams
 * @property {string} credentialId - Credential to query
 */

/**
 * @typedef {object} BalanceResult
 * @property {number} credits - Number of credits remaining
 */

/**
 * @typedef {object} RedeemParams
 * @property {string} token - Redemption token to verify
 */

/**
 * @typedef {object} RedeemResult
 * @property {boolean} valid - Whether the token is valid
 */

/**
 * Privacy Pass ACT (Anonymous Credit Tokens) prototype feature.
 *
 * Implements draft-schlesinger-privacypass-act — exposes navigator.privacyPass
 * API for credential issuance, credit spending, balance queries, and token redemption.
 *
 * The actual cryptographic operations are delegated to native code via messaging.
 * This JS layer provides the web-facing API and marshals calls to/from native.
 *
 * @see https://datatracker.ietf.org/doc/draft-schlesinger-privacypass-act/
 */
export default class PrivacyPass extends ContentFeature {
    init() {
        const requestFn = this.request.bind(this);

        const privacyPassAPI = {
            /**
             * Issue a new credential with the specified number of credits.
             * @param {IssueParams} params
             * @returns {Promise<IssueResult>}
             */
            issue(params) {
                const { issuer, credits } = params;
                if (typeof issuer !== 'string' || issuer.length === 0) {
                    return Promise.reject(new Error('issuer must be a non-empty string'));
                }
                if (typeof credits !== 'number' || credits <= 0 || !Number.isInteger(credits)) {
                    return Promise.reject(new Error('credits must be a positive integer'));
                }
                return requestFn('issue', { issuer, credits });
            },

            /**
             * Spend credits from a credential. The old credential is invalidated
             * and a new credential with the remaining balance is returned.
             * @param {SpendParams} params
             * @returns {Promise<SpendResult>}
             */
            spend(params) {
                const { credentialId, amount } = params;
                if (typeof credentialId !== 'string' || credentialId.length === 0) {
                    return Promise.reject(new Error('credentialId must be a non-empty string'));
                }
                if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
                    return Promise.reject(new Error('amount must be a positive integer'));
                }
                return requestFn('spend', { credentialId, amount });
            },

            /**
             * Query the remaining credit balance of a credential.
             * @param {BalanceParams} params
             * @returns {Promise<BalanceResult>}
             */
            balance(params) {
                const { credentialId } = params;
                if (typeof credentialId !== 'string' || credentialId.length === 0) {
                    return Promise.reject(new Error('credentialId must be a non-empty string'));
                }
                return requestFn('balance', { credentialId });
            },

            /**
             * Redeem (verify) a token obtained from a spend operation.
             * @param {RedeemParams} params
             * @returns {Promise<RedeemResult>}
             */
            redeem(params) {
                const { token } = params;
                if (typeof token !== 'string' || token.length === 0) {
                    return Promise.reject(new Error('token must be a non-empty string'));
                }
                return requestFn('redeem', { token });
            },
        };

        this.defineProperty(Navigator.prototype, 'privacyPass', {
            get: () => privacyPassAPI,
            configurable: true,
            enumerable: true,
        });
    }
}
