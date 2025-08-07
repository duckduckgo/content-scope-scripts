import { MetricsReporter } from '../metrics-reporter.js';
import { Messaging, MessagingContext, TestTransportConfig } from '@duckduckgo/messaging';

const messaging = createMessaging();
const metrics = new MetricsReporter(messaging);

// Report a custom metric
metrics.reportMetric({
    metricName: 'exception',
    params: { kind: 'abc', message: 'something went' },
});

// Report an exception
metrics.reportException({
    message: 'Failed to load user data',
    kind: 'NetworkError',
});

// Report an exception by passing an Error object
metrics.reportExceptionWithError(new Error('Missing params'));

// test messaging example
function createMessaging() {
    const context = new MessagingContext({
        context: 'test',
        env: 'development',
        featureName: 'testFeature',
    });
    const config = new TestTransportConfig({
        notify() {},
        request() {
            return Promise.resolve(null);
        },
        subscribe() {
            return () => {};
        },
    });
    return new Messaging(context, config);
}
