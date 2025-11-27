import ContentFeature from '../content-feature.js';
import { wrapToString } from '../wrapper-utils.js';

/**
 * Web Notifications feature - provides a polyfill for the Web Notifications API
 * that communicates with native code for permission management and notification display.
 */
export default class WebNotifications extends ContentFeature {
    /** @type {Map<string, object>} */
    #notifications = new Map();

    init() {
        console.log('[WebNotifications] init() called');
        this.#initNotificationPolyfill();
        console.log('[WebNotifications] Notification polyfill installed');
    }

    #initNotificationPolyfill() {
        const feature = this;

        /**
         * NotificationPolyfill - replaces the native Notification API
         */
        class NotificationPolyfill {
            /** @type {string} */
            #id;
            /** @type {string} */
            title;
            /** @type {string} */
            body;
            /** @type {string} */
            icon;
            /** @type {string} */
            tag;
            /** @type {any} */
            data;

            // Event handlers
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onclick = null;
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onclose = null;
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onerror = null;
            /** @type {((this: Notification, ev: Event) => any) | null} */
            onshow = null;

            /**
             * @returns {'default' | 'denied' | 'granted'}
             */
            static get permission() {
                // For now, always return 'granted' - Project 5 will query native
                return 'granted';
            }

            /**
             * @param {NotificationPermissionCallback} [deprecatedCallback]
             * @returns {Promise<NotificationPermission>}
             */
            static async requestPermission(deprecatedCallback) {
                try {
                    const result = await feature.request('requestPermission', {});
                    const permission = result?.permission || 'granted';
                    if (deprecatedCallback) {
                        deprecatedCallback(permission);
                    }
                    return permission;
                } catch (e) {
                    feature.log.error('requestPermission failed:', e);
                    const fallback = 'granted';
                    if (deprecatedCallback) {
                        deprecatedCallback(fallback);
                    }
                    return fallback;
                }
            }

            /**
             * @returns {number}
             */
            static get maxActions() {
                return 2;
            }

            /**
             * @param {string} title
             * @param {NotificationOptions} [options]
             */
            constructor(title, options = {}) {
                this.#id = crypto.randomUUID();
                this.title = title;
                this.body = options.body || '';
                this.icon = options.icon || '';
                this.tag = options.tag || '';
                this.data = options.data;

                feature.#notifications.set(this.#id, this);

                feature.notify('showNotification', {
                    id: this.#id,
                    title: this.title,
                    body: this.body,
                    icon: this.icon,
                    tag: this.tag,
                });
            }

            close() {
                feature.notify('closeNotification', { id: this.#id });
                feature.#notifications.delete(this.#id);
            }
        }

        // Wrap the constructor to make toString() look native
        const wrappedNotification = wrapToString(
            NotificationPolyfill,
            NotificationPolyfill,
            'function Notification() { [native code] }',
        );

        // Wrap static methods
        const wrappedRequestPermission = wrapToString(
            NotificationPolyfill.requestPermission.bind(NotificationPolyfill),
            NotificationPolyfill.requestPermission,
            'function requestPermission() { [native code] }',
        );

        // Subscribe to notification events from native
        this.subscribe('notificationEvent', (data) => {
            const notification = this.#notifications.get(data.id);
            if (!notification) return;

            const eventName = `on${data.event}`;
            if (typeof notification[eventName] === 'function') {
                try {
                    notification[eventName].call(notification, new Event(data.event));
                } catch (e) {
                    feature.log.error(`Error in ${eventName} handler:`, e);
                }
            }

            // Clean up on close event
            if (data.event === 'close') {
                this.#notifications.delete(data.id);
            }
        });

        // Define the Notification property on globalThis
        this.defineProperty(globalThis, 'Notification', {
            value: wrappedNotification,
            writable: true,
            configurable: true,
            enumerable: false,
        });

        // Define permission getter (return value directly to avoid recursion)
        this.defineProperty(globalThis.Notification, 'permission', {
            get: () => 'granted', // For now, always return 'granted' - Project 5 will query native
            configurable: true,
            enumerable: true,
        });

        // Define maxActions getter (return value directly to avoid recursion)
        this.defineProperty(globalThis.Notification, 'maxActions', {
            get: () => 2,
            configurable: true,
            enumerable: true,
        });

        // Define requestPermission
        this.defineProperty(globalThis.Notification, 'requestPermission', {
            value: wrappedRequestPermission,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }
}

