import { isObject, isString } from '../../type-utils.js';

/**
 * @import { Messaging } from "@duckduckgo/messaging";
 * @typedef {Pick<Messaging, 'notify' | 'request' | 'subscribe'>} MessagingInterface
 */

/**
 * Validates an optional object field on a validated parent object.
 * Returns the field value if it's a valid object, `undefined` if absent or null, or `null` if invalid (present but not an object).
 * @param {object} obj
 * @param {string} key
 * @returns {object | undefined | null}
 */
function optionalObject(obj, key) {
    if (!(key in obj)) return undefined;
    const val = /** @type {Record<string, unknown>} */ (obj)[key];
    if (val == null) return undefined;
    return isObject(val) ? val : null;
}

/**
 * Sending this event
 */
export class InstallProxy {
    static NAME = 'INSTALL_BRIDGE';
    get name() {
        return InstallProxy.NAME;
    }

    /**
     * @param {object} params
     * @param {string} params.featureName
     * @param {string} params.id
     */
    constructor(params) {
        this.featureName = params.featureName;
        this.id = params.id;
    }

    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('featureName' in params) || !isString(params.featureName)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        return new InstallProxy({ featureName: params.featureName, id: params.id });
    }
}

export class DidInstall {
    static NAME = 'DID_INSTALL';
    get name() {
        return DidInstall.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.id
     */
    constructor(params) {
        this.id = params.id;
    }

    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        return new DidInstall({ id: params.id });
    }
}

export class ProxyRequest {
    static NAME = 'PROXY_REQUEST';
    get name() {
        return ProxyRequest.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {string} params.id
     * @param {object} [params.params]
     */
    constructor(params) {
        this.featureName = params.featureName;
        this.method = params.method;
        this.params = params.params;
        this.id = params.id;
    }
    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('featureName' in params) || !isString(params.featureName)) return null;
        if (!('method' in params) || !isString(params.method)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        const requestParams = optionalObject(params, 'params');
        if (requestParams === null) return null;
        return new ProxyRequest({
            featureName: params.featureName,
            method: params.method,
            params: requestParams,
            id: params.id,
        });
    }
}

export class ProxyResponse {
    static NAME = 'PROXY_RESPONSE';
    get name() {
        return ProxyResponse.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {string} params.id
     * @param {object} [params.result]
     * @param {object} [params.error]
     */
    constructor(params) {
        this.featureName = params.featureName;
        this.method = params.method;
        this.result = params.result;
        this.error = params.error;
        this.id = params.id;
    }
    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('featureName' in params) || !isString(params.featureName)) return null;
        if (!('method' in params) || !isString(params.method)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        const responseResult = optionalObject(params, 'result');
        if (responseResult === null) return null;
        const responseError = optionalObject(params, 'error');
        if (responseError === null) return null;
        return new ProxyResponse({
            featureName: params.featureName,
            method: params.method,
            result: responseResult,
            error: responseError,
            id: params.id,
        });
    }
}

/**
 */
export class ProxyNotification {
    static NAME = 'PROXY_NOTIFICATION';
    get name() {
        return ProxyNotification.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.featureName
     * @param {string} params.method
     * @param {object} [params.params]
     */
    constructor(params) {
        this.featureName = params.featureName;
        this.method = params.method;
        this.params = params.params;
    }

    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('featureName' in params) || !isString(params.featureName)) return null;
        if (!('method' in params) || !isString(params.method)) return null;
        const notificationParams = optionalObject(params, 'params');
        if (notificationParams === null) return null;
        return new ProxyNotification({
            featureName: params.featureName,
            method: params.method,
            params: notificationParams,
        });
    }
}

export class SubscriptionRequest {
    static NAME = 'SUBSCRIPTION_REQUEST';
    get name() {
        return SubscriptionRequest.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.featureName
     * @param {string} params.subscriptionName
     * @param {string} params.id
     */
    constructor(params) {
        this.featureName = params.featureName;
        this.subscriptionName = params.subscriptionName;
        this.id = params.id;
    }
    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('featureName' in params) || !isString(params.featureName)) return null;
        if (!('subscriptionName' in params) || !isString(params.subscriptionName)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        return new SubscriptionRequest({
            featureName: params.featureName,
            subscriptionName: params.subscriptionName,
            id: params.id,
        });
    }
}

export class SubscriptionResponse {
    static NAME = 'SUBSCRIPTION_RESPONSE';
    get name() {
        return SubscriptionResponse.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.featureName
     * @param {string} params.subscriptionName
     * @param {string} params.id
     * @param {object} [params.params]
     */
    constructor(params) {
        this.featureName = params.featureName;
        this.subscriptionName = params.subscriptionName;
        this.id = params.id;
        this.params = params.params;
    }
    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('featureName' in params) || !isString(params.featureName)) return null;
        if (!('subscriptionName' in params) || !isString(params.subscriptionName)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        const responseParams = optionalObject(params, 'params');
        if (responseParams === null) return null;
        return new SubscriptionResponse({
            featureName: params.featureName,
            subscriptionName: params.subscriptionName,
            params: responseParams,
            id: params.id,
        });
    }
}

export class SubscriptionUnsubscribe {
    static NAME = 'SUBSCRIPTION_UNSUBSCRIBE';
    get name() {
        return SubscriptionUnsubscribe.NAME;
    }
    /**
     * @param {object} params
     * @param {string} params.id
     */
    constructor(params) {
        this.id = params.id;
    }
    /**
     * @param {unknown} params
     */
    static create(params) {
        if (!isObject(params)) return null;
        if (!('id' in params) || !isString(params.id)) return null;
        return new SubscriptionUnsubscribe({
            id: params.id,
        });
    }
}
