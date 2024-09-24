import { TestTransportConfig } from "@duckduckgo/messaging";

export function mockTransport() {
    const channel = new BroadcastChannel('ntp');

    function broadcast() {
        setTimeout(() => {
            channel.postMessage({
                "change": "ntp.widgetConfig"
            })
        }, 100)
    }

    /**
     * @param {string} name
     * @return {Record<string, any>|null}
     */
    function read(name) {
        try {
            const item = localStorage.getItem(name);
            if (!item) return null;
            console.log('did read from LS', item);
            return JSON.parse(item);
        } catch (e) {
            console.error('Failed to parse initialSetup from localStorage', e);
            return null;
        }
    }

    /**
     * @param {string} name
     * @param {Record<string, any>} value
     */
    function write(name, value) {
        try {
            localStorage.setItem(name, JSON.stringify(value));
            console.log('✅ did write')
        } catch (e) {
            console.error('Failed to write', e);
        }
    }

    return new TestTransportConfig({
        notify(msg) {
            switch (msg.method) {
                case "setWidgetConfig": {
                    if (!msg.params) throw new Error('unreachable')
                    write('ntp.widgetConfig', msg.params)
                    broadcast()
                    return
                }
                default: {
                    console.warn("unhandled notification", msg)
                }
            }
        },
        subscribe(sub, cb) {
            switch (sub.subscriptionName) {
                case "onWidgetConfigUpdated": {
                    const controller = new AbortController()
                    // console.log('sub?', sub, cb);
                    channel.addEventListener('message', (message) => {
                        // console.log('channel.addEventListener incoming', message.data);
                        const values = read('ntp.widgetConfig');
                        if (values) {
                            cb(values)
                        }
                    }, { signal: controller.signal })
                    return () => controller.abort()
                }
            }
            return () => {}
        },
        async request(msg) {
            switch (msg.method) {
                case "initialSetup": {
                    const widgetsFromStorage = read('ntp.widgets') || {
                        widgets: [
                            { id: 'favorites' },
                            { id: 'privacyStats' }
                        ]
                    };
                    const widgetConfigFromStorage = read('ntp.widgetConfig') || {
                        widgetConfig: [
                            { id: 'favorites', visibility: 'visible' },
                            { id: 'privacyStats', visibility: 'visible' }
                        ]
                    }
                    return Promise.resolve({
                        widgets: widgetsFromStorage.widgets,
                        widgetConfig: widgetConfigFromStorage.widgetConfig,
                        platform: { name: 'integration' },
                        env: 'development',
                        locale: 'en'
                    })
                }
                default: {
                    return Promise.reject(new Error("unhandled request"))
                }
            }
        }
    })
}
