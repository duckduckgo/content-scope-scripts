import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { reportMetric } from '../shared/report-metric.js';

// @ts-expect-error - this is a mock
const messaging = /** @type {Messaging} */ ({
    notify: mock.fn((params) => {
        console.log('Notify called with', params);
    }),
});

describe('reportMetric', () => {
    it('should throw an error if messaging is not provided', () => {
        const eventParams = /** @type {any} */ ({ metricName: '', params: {} });
        // @ts-expect-error - this is a forced error
        assert.throws(() => reportMetric(null, eventParams));
        assert.strictEqual(messaging.notify.mock.callCount(), 0);
    });

    it('should throw an error if metricName is not provided', () => {
        const eventParams = /** @type {any} */ ({ metricName: '', params: {} });
        assert.throws(() => reportMetric(messaging, eventParams));
        assert.strictEqual(messaging.notify.mock.callCount(), 0);
    });

    it('should call messaging.notify with the correct parameters', () => {
        const eventParams = /** @type {any} */ ({ metricName: 'exception', params: { message: 'This is a test' } });
        assert.strictEqual(messaging.notify.mock.callCount(), 0);
        reportMetric(messaging, eventParams);
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
});
