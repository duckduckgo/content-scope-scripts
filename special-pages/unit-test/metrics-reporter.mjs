import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MetricsReporter } from '../shared/metrics/metrics-reporter.js';

describe('reportMetric', () => {
    let messaging;

    beforeEach(() => {
        // Create the mock inside beforeEach to ensure it's fresh for each test
        messaging = /** @type {any} */ ({
            notify: mock.fn((params) => {
                console.log('Notify called with', params);
            }),
        });
    });

    it('should throw an error if messaging is not provided', () => {
        // @ts-expect-error - this is a forced error
        assert.throws(() => new MetricsReporter(null));
    });

    it('should throw an error if metricName is not provided', () => {
        const metrics = new MetricsReporter(messaging);
        const metricParams = /** @type {any} */ ({ metricName: '', params: {} });
        assert.throws(() => metrics.reportMetric(metricParams));
        assert.strictEqual(messaging.notify.mock.callCount(), 0);
    });

    it('should call messaging.notify with the correct parameters', () => {
        const metrics = new MetricsReporter(messaging);
        const metricParams = /** @type {any} */ ({ metricName: 'exception', params: { message: 'This is a test' } });
        assert.strictEqual(messaging.notify.mock.callCount(), 0);

        metrics.reportMetric(metricParams);
        assert.strictEqual(messaging.notify.mock.callCount(), 1);
        const call = messaging.notify.mock.calls[0];
        assert.deepEqual(call.arguments, [
            'reportMetric',
            {
                metricName: 'exception',
                params: { message: 'This is a test' },
            },
        ]);
    });

    it('should call messaging.notify when reportException is called', () => {
        const metrics = new MetricsReporter(messaging);
        const eventParams = /** @type {any} */ ({ message: 'This is a test', kind: 'TestError' });
        assert.strictEqual(messaging.notify.mock.callCount(), 0);

        metrics.reportException(eventParams);
        assert.strictEqual(messaging.notify.mock.callCount(), 1);
        const call = messaging.notify.mock.calls[0];
        assert.deepEqual(call.arguments, [
            'reportMetric',
            {
                metricName: 'exception',
                params: { message: 'This is a test', kind: 'TestError' },
            },
        ]);
    });

    it('should send default values when reportException is called with empty params', () => {
        const metrics = new MetricsReporter(messaging);
        const eventParams = /** @type {any} */ ({});
        assert.strictEqual(messaging.notify.mock.callCount(), 0);

        metrics.reportException(eventParams);
        assert.strictEqual(messaging.notify.mock.callCount(), 1);
        const call = messaging.notify.mock.calls[0];
        assert.deepEqual(call.arguments, [
            'reportMetric',
            {
                metricName: 'exception',
                params: { message: 'Unknown error', kind: 'Error' },
            },
        ]);
    });

    it('should not report anything when reportExceptionWithError is called with a non-Error object', () => {
        const metrics = new MetricsReporter(messaging);
        const eventParams = /** @type {any} */ ({ message: 'This is a test', kind: 'TestError' });
        assert.strictEqual(messaging.notify.mock.callCount(), 0);

        metrics.reportExceptionWithError(eventParams);
        assert.strictEqual(messaging.notify.mock.callCount(), 0);
    });

    it('should send the error message and kind when reportExceptionWithError is called with an Error object', () => {
        const metrics = new MetricsReporter(messaging);
        const error = new Error('This is a test');
        error.name = 'TestError';
        assert.strictEqual(messaging.notify.mock.callCount(), 0);

        metrics.reportExceptionWithError(error);
        assert.strictEqual(messaging.notify.mock.callCount(), 1);
        const call = messaging.notify.mock.calls[0];
        assert.deepEqual(call.arguments, [
            'reportMetric',
            {
                metricName: 'exception',
                params: { message: 'This is a test', kind: 'TestError' },
            },
        ]);
    });

    it('should send default values when reportExceptionWithError is called with an empty error object', () => {
        const metrics = new MetricsReporter(messaging);
        const error = new Error();
        assert.strictEqual(messaging.notify.mock.callCount(), 0);

        metrics.reportExceptionWithError(error);
        assert.strictEqual(messaging.notify.mock.callCount(), 1);
        const call = messaging.notify.mock.calls[0];
        assert.deepEqual(call.arguments, [
            'reportMetric',
            { metricName: 'exception', params: { message: 'Unknown error', kind: 'Error' } },
        ]);
    });
});
