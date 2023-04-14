import {
    Messaging,
    MessagingContext,
    TestTransportConfig,
    RequestMessage, NotificationMessage, Subscription
} from '@duckduckgo/messaging'

describe('Messaging Transports', () => {
    it('calls transport with a RequestMessage', () => {
        const { messaging, transport } = createMessaging()

        const spy = spyOn(transport, 'request')

        messaging.request('helloWorld', { foo: 'bar' })

        expect(spy).toHaveBeenCalledWith(new RequestMessage({
            context: 'contentScopeScripts',
            featureName: 'hello-world',
            id: 'helloWorld.response',
            method: 'helloWorld',
            params: { foo: 'bar' }
        }))
    })
    it('calls transport with a NotificationMessage', () => {
        const { messaging, transport } = createMessaging()

        const spy = spyOn(transport, 'notify')

        messaging.notify('helloWorld', { foo: 'bar' })

        expect(spy).toHaveBeenCalledWith(new NotificationMessage({
            context: 'contentScopeScripts',
            featureName: 'hello-world',
            method: 'helloWorld',
            params: { foo: 'bar' }
        }))
    })
    it('calls transport with a Subscription', () => {
        const { messaging, transport } = createMessaging()

        const spy = spyOn(transport, 'subscribe')
        const callback = jasmine.createSpy()

        messaging.subscribe('helloWorld', callback)

        expect(spy).toHaveBeenCalledWith(new Subscription({
            context: 'contentScopeScripts',
            featureName: 'hello-world',
            subscriptionName: 'helloWorld'
        }), callback)
    })
})

/**
 * Creates a test transport and Messaging instance for testing
 */
function createMessaging () {
    /** @type {import("@duckduckgo/messaging").MessagingTransport} */
    const transport = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        notify (msg) {
            // test
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: (_msg) => {
            // test
            return Promise.resolve(null)
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        subscribe (_msg) {
            // test
            return () => {
                // test teardown
            }
        }
    }

    const testTransportConfig = new TestTransportConfig(transport)

    const messagingContext = new MessagingContext({
        context: 'contentScopeScripts',
        featureName: 'hello-world',
        env: 'development'
    })

    const messaging = new Messaging(messagingContext, testTransportConfig)

    return { transport, messaging }
}
