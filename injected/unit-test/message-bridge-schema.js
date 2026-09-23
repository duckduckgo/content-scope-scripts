import {
    InstallProxy,
    DidInstall,
    ProxyRequest,
    ProxyResponse,
    ProxyNotification,
    SubscriptionRequest,
    SubscriptionResponse,
    SubscriptionUnsubscribe,
} from '../src/features/message-bridge/schema.js';

describe('InstallProxy.create', () => {
    it('accepts valid input', () => {
        const result = InstallProxy.create({ featureName: 'test', id: '123' });
        expect(result).not.toBeNull();
        expect(result?.featureName).toBe('test');
        expect(result?.id).toBe('123');
    });
    it('rejects non-object', () => {
        expect(InstallProxy.create(null)).toBeNull();
        expect(InstallProxy.create(undefined)).toBeNull();
        expect(InstallProxy.create('string')).toBeNull();
        expect(InstallProxy.create(42)).toBeNull();
    });
    it('rejects missing required fields', () => {
        expect(InstallProxy.create({})).toBeNull();
        expect(InstallProxy.create({ featureName: 'test' })).toBeNull();
        expect(InstallProxy.create({ id: '123' })).toBeNull();
    });
    it('rejects non-string required fields', () => {
        expect(InstallProxy.create({ featureName: 123, id: '123' })).toBeNull();
        expect(InstallProxy.create({ featureName: 'test', id: 123 })).toBeNull();
    });
});

describe('DidInstall.create', () => {
    it('accepts valid input', () => {
        const result = DidInstall.create({ id: '123' });
        expect(result).not.toBeNull();
        expect(result?.id).toBe('123');
    });
    it('rejects missing id', () => {
        expect(DidInstall.create({})).toBeNull();
    });
    it('rejects non-string id', () => {
        expect(DidInstall.create({ id: 123 })).toBeNull();
    });
});

describe('ProxyRequest.create', () => {
    const valid = { featureName: 'test', method: 'doThing', id: '123' };

    it('accepts valid input without params', () => {
        const result = ProxyRequest.create(valid);
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('accepts valid input with object params', () => {
        const result = ProxyRequest.create({ ...valid, params: { key: 'val' } });
        expect(result).not.toBeNull();
        expect(result?.params).toEqual({ key: 'val' });
    });
    it('normalizes null params to undefined', () => {
        const result = ProxyRequest.create({ ...valid, params: null });
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('normalizes undefined params to undefined', () => {
        const result = ProxyRequest.create({ ...valid, params: undefined });
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('rejects primitive params', () => {
        expect(ProxyRequest.create({ ...valid, params: 'string' })).toBeNull();
        expect(ProxyRequest.create({ ...valid, params: 42 })).toBeNull();
        expect(ProxyRequest.create({ ...valid, params: true })).toBeNull();
    });
    it('rejects missing required fields', () => {
        expect(ProxyRequest.create({ method: 'doThing', id: '123' })).toBeNull();
        expect(ProxyRequest.create({ featureName: 'test', id: '123' })).toBeNull();
        expect(ProxyRequest.create({ featureName: 'test', method: 'doThing' })).toBeNull();
    });
});

describe('ProxyResponse.create', () => {
    const valid = { featureName: 'test', method: 'doThing', id: '123' };

    it('accepts valid input without result or error', () => {
        const result = ProxyResponse.create(valid);
        expect(result).not.toBeNull();
        expect(result?.result).toBeUndefined();
        expect(result?.error).toBeUndefined();
    });
    it('accepts valid input with result object', () => {
        const result = ProxyResponse.create({ ...valid, result: { data: 1 } });
        expect(result).not.toBeNull();
        expect(result?.result).toEqual({ data: 1 });
    });
    it('accepts valid input with error object', () => {
        const result = ProxyResponse.create({ ...valid, error: { message: 'fail' } });
        expect(result).not.toBeNull();
        expect(result?.error).toEqual({ message: 'fail' });
    });
    it('normalizes null result to undefined', () => {
        const result = ProxyResponse.create({ ...valid, result: null });
        expect(result).not.toBeNull();
        expect(result?.result).toBeUndefined();
    });
    it('normalizes null error to undefined', () => {
        const result = ProxyResponse.create({ ...valid, error: null });
        expect(result).not.toBeNull();
        expect(result?.error).toBeUndefined();
    });
    it('rejects primitive result', () => {
        expect(ProxyResponse.create({ ...valid, result: 'string' })).toBeNull();
        expect(ProxyResponse.create({ ...valid, result: 42 })).toBeNull();
    });
    it('rejects primitive error', () => {
        expect(ProxyResponse.create({ ...valid, error: 'string' })).toBeNull();
        expect(ProxyResponse.create({ ...valid, error: 42 })).toBeNull();
    });
    it('rejects missing required fields', () => {
        expect(ProxyResponse.create({ method: 'doThing', id: '123' })).toBeNull();
        expect(ProxyResponse.create({ featureName: 'test', id: '123' })).toBeNull();
        expect(ProxyResponse.create({ featureName: 'test', method: 'doThing' })).toBeNull();
    });
});

describe('ProxyNotification.create', () => {
    const valid = { featureName: 'test', method: 'doThing' };

    it('accepts valid input without params', () => {
        const result = ProxyNotification.create(valid);
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('accepts valid input with object params', () => {
        const result = ProxyNotification.create({ ...valid, params: { key: 'val' } });
        expect(result).not.toBeNull();
        expect(result?.params).toEqual({ key: 'val' });
    });
    it('normalizes null params to undefined', () => {
        const result = ProxyNotification.create({ ...valid, params: null });
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('rejects primitive params', () => {
        expect(ProxyNotification.create({ ...valid, params: 'string' })).toBeNull();
        expect(ProxyNotification.create({ ...valid, params: 42 })).toBeNull();
    });
});

describe('SubscriptionRequest.create', () => {
    const valid = { featureName: 'test', subscriptionName: 'onUpdate', id: '123' };

    it('accepts valid input', () => {
        const result = SubscriptionRequest.create(valid);
        expect(result).not.toBeNull();
        expect(result?.featureName).toBe('test');
        expect(result?.subscriptionName).toBe('onUpdate');
        expect(result?.id).toBe('123');
    });
    it('rejects missing required fields', () => {
        expect(SubscriptionRequest.create({ subscriptionName: 'onUpdate', id: '123' })).toBeNull();
        expect(SubscriptionRequest.create({ featureName: 'test', id: '123' })).toBeNull();
        expect(SubscriptionRequest.create({ featureName: 'test', subscriptionName: 'onUpdate' })).toBeNull();
    });
});

describe('SubscriptionResponse.create', () => {
    const valid = { featureName: 'test', subscriptionName: 'onUpdate', id: '123' };

    it('accepts valid input without params', () => {
        const result = SubscriptionResponse.create(valid);
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('accepts valid input with object params', () => {
        const result = SubscriptionResponse.create({ ...valid, params: { key: 'val' } });
        expect(result).not.toBeNull();
        expect(result?.params).toEqual({ key: 'val' });
    });
    it('normalizes null params to undefined', () => {
        const result = SubscriptionResponse.create({ ...valid, params: null });
        expect(result).not.toBeNull();
        expect(result?.params).toBeUndefined();
    });
    it('rejects primitive params', () => {
        expect(SubscriptionResponse.create({ ...valid, params: 'string' })).toBeNull();
    });
});

describe('SubscriptionUnsubscribe.create', () => {
    it('accepts valid input', () => {
        const result = SubscriptionUnsubscribe.create({ id: '123' });
        expect(result).not.toBeNull();
        expect(result?.id).toBe('123');
    });
    it('rejects missing id', () => {
        expect(SubscriptionUnsubscribe.create({})).toBeNull();
    });
    it('rejects non-string id', () => {
        expect(SubscriptionUnsubscribe.create({ id: 123 })).toBeNull();
    });
});
