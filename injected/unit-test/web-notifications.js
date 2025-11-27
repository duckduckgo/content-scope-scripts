import WebNotifications from '../src/features/web-notifications.js';

describe('WebNotifications feature', () => {
    /** @type {WebNotifications} */
    let feature;
    let mockMessaging;
    let mockSubscribeCallback;

    beforeEach(() => {
        // Reset globalThis.Notification if it exists
        if (globalThis.Notification) {
            delete globalThis.Notification;
        }

        // Create mock messaging
        mockMessaging = {
            notify: jasmine.createSpy('notify'),
            request: jasmine.createSpy('request').and.returnValue(Promise.resolve({ permission: 'granted' })),
            subscribe: jasmine.createSpy('subscribe').and.callFake((name, cb) => {
                mockSubscribeCallback = cb;
                return () => {};
            }),
        };

        feature = new WebNotifications(
            'webNotifications',
            {},
            {
                site: { domain: 'example.com', url: 'https://example.com' },
                platform: { name: 'apple', internal: true },
            },
        );

        // Override messaging getter
        Object.defineProperty(feature, 'messaging', {
            get: () => mockMessaging,
        });

        // Override _messaging
        feature._messaging = mockMessaging;

        feature.callInit({
            site: { domain: 'example.com', url: 'https://example.com' },
            platform: { name: 'apple', internal: true },
        });
    });

    afterEach(() => {
        if (globalThis.Notification) {
            delete globalThis.Notification;
        }
    });

    describe('Notification polyfill setup', () => {
        it('should define Notification on window', () => {
            expect(globalThis.Notification).toBeDefined();
        });

        it('should define Notification.permission as granted by default', () => {
            expect(globalThis.Notification.permission).toBe('granted');
        });

        it('should define Notification.maxActions as 2', () => {
            expect(globalThis.Notification.maxActions).toBe(2);
        });

        it('should define Notification.requestPermission as a function', () => {
            expect(typeof globalThis.Notification.requestPermission).toBe('function');
        });
    });

    describe('Notification constructor', () => {
        it('should create a notification with title', () => {
            const notification = new globalThis.Notification('Test Title');
            expect(notification.title).toBe('Test Title');
        });

        it('should create a notification with options', () => {
            const notification = new globalThis.Notification('Test', {
                body: 'Test body',
                icon: 'https://example.com/icon.png',
                tag: 'test-tag',
            });
            expect(notification.body).toBe('Test body');
            expect(notification.icon).toBe('https://example.com/icon.png');
            expect(notification.tag).toBe('test-tag');
        });

        it('should call notify with showNotification message', () => {
            new globalThis.Notification('Test Title', { body: 'Test body' });
            expect(mockMessaging.notify).toHaveBeenCalledWith('showNotification', jasmine.objectContaining({
                title: 'Test Title',
                body: 'Test body',
            }));
        });

        it('should generate a unique id for each notification', () => {
            new globalThis.Notification('Test 1');
            new globalThis.Notification('Test 2');
            const calls = mockMessaging.notify.calls.allArgs();
            const id1 = calls[0][1].id;
            const id2 = calls[1][1].id;
            expect(id1).not.toBe(id2);
        });

        it('should have null event handlers by default', () => {
            const notification = new globalThis.Notification('Test');
            expect(notification.onclick).toBeNull();
            expect(notification.onclose).toBeNull();
            expect(notification.onerror).toBeNull();
            expect(notification.onshow).toBeNull();
        });
    });

    describe('Notification.close()', () => {
        it('should call notify with closeNotification message', () => {
            const notification = new globalThis.Notification('Test');
            const showCall = mockMessaging.notify.calls.mostRecent();
            const notificationId = showCall.args[1].id;

            notification.close();

            expect(mockMessaging.notify).toHaveBeenCalledWith('closeNotification', {
                id: notificationId,
            });
        });
    });

    describe('Notification.requestPermission()', () => {
        it('should return a promise that resolves to permission', async () => {
            const result = await globalThis.Notification.requestPermission();
            expect(result).toBe('granted');
        });

        it('should call the deprecated callback if provided', async () => {
            const callback = jasmine.createSpy('callback');
            await globalThis.Notification.requestPermission(callback);
            expect(callback).toHaveBeenCalledWith('granted');
        });

        it('should call request with requestPermission message', async () => {
            await globalThis.Notification.requestPermission();
            expect(mockMessaging.request).toHaveBeenCalledWith('requestPermission', {});
        });

        it('should handle request errors gracefully', async () => {
            mockMessaging.request.and.returnValue(Promise.reject(new Error('Network error')));
            const result = await globalThis.Notification.requestPermission();
            expect(result).toBe('granted'); // Falls back to granted
        });
    });

    describe('Notification events', () => {
        it('should subscribe to notificationEvent', () => {
            expect(mockMessaging.subscribe).toHaveBeenCalledWith('notificationEvent', jasmine.any(Function));
        });

        it('should call onclick handler when click event is received', () => {
            const notification = new globalThis.Notification('Test');
            const showCall = mockMessaging.notify.calls.mostRecent();
            const notificationId = showCall.args[1].id;

            const clickHandler = jasmine.createSpy('onclick');
            notification.onclick = clickHandler;

            mockSubscribeCallback({ id: notificationId, event: 'click' });

            expect(clickHandler).toHaveBeenCalled();
        });

        it('should call onshow handler when show event is received', () => {
            const notification = new globalThis.Notification('Test');
            const showCall = mockMessaging.notify.calls.mostRecent();
            const notificationId = showCall.args[1].id;

            const showHandler = jasmine.createSpy('onshow');
            notification.onshow = showHandler;

            mockSubscribeCallback({ id: notificationId, event: 'show' });

            expect(showHandler).toHaveBeenCalled();
        });

        it('should call onclose handler when close event is received', () => {
            const notification = new globalThis.Notification('Test');
            const showCall = mockMessaging.notify.calls.mostRecent();
            const notificationId = showCall.args[1].id;

            const closeHandler = jasmine.createSpy('onclose');
            notification.onclose = closeHandler;

            mockSubscribeCallback({ id: notificationId, event: 'close' });

            expect(closeHandler).toHaveBeenCalled();
        });

        it('should call onerror handler when error event is received', () => {
            const notification = new globalThis.Notification('Test');
            const showCall = mockMessaging.notify.calls.mostRecent();
            const notificationId = showCall.args[1].id;

            const errorHandler = jasmine.createSpy('onerror');
            notification.onerror = errorHandler;

            mockSubscribeCallback({ id: notificationId, event: 'error' });

            expect(errorHandler).toHaveBeenCalled();
        });

        it('should not throw if event handler is not set', () => {
            const notification = new globalThis.Notification('Test');
            const showCall = mockMessaging.notify.calls.mostRecent();
            const notificationId = showCall.args[1].id;

            expect(() => {
                mockSubscribeCallback({ id: notificationId, event: 'click' });
            }).not.toThrow();
        });

        it('should ignore events for unknown notification ids', () => {
            const notification = new globalThis.Notification('Test');
            const clickHandler = jasmine.createSpy('onclick');
            notification.onclick = clickHandler;

            mockSubscribeCallback({ id: 'unknown-id', event: 'click' });

            expect(clickHandler).not.toHaveBeenCalled();
        });
    });

    describe('toString behavior', () => {
        it('should have native-like toString for Notification', () => {
            expect(globalThis.Notification.toString()).toBe('function Notification() { [native code] }');
        });

        it('should have native-like toString for requestPermission', () => {
            expect(globalThis.Notification.requestPermission.toString()).toBe('function requestPermission() { [native code] }');
        });
    });
});

