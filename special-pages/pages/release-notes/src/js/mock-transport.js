import { TestTransportConfig } from '@duckduckgo/messaging';
import { sampleData } from '../../app/sampleData';

/**
 * @typedef {import('../../types/release-notes.js').UpdateMessage} UpdateMessage
 */

export function mockTransport() {
    /**
     * Allows for sample data overrides. Overrides can be combined. Ex:
     *
     * ?stateId=updateReady&manualUpdate
     * ?stateId=loaded&noPrivacyPro
     * ?stateId=updateReady&manualUpdate&noPrivacyPro
     *
     * @type {Record<string, Partial<UpdateMessage>>}
     */
    const dataOverrides = {
        manualUpdate: {
            automaticUpdate: false,
        },
        noPrivacyPro: {
            releaseNotesPrivacyPro: undefined,
        },
    };

    return new TestTransportConfig({
        notify(_msg) {},
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../../types/release-notes.js').ReleaseNotesMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'initialSetup': {
                    return Promise.resolve({
                        env: 'development',
                        locale: 'en',
                    });
                }
                default:
                    return Promise.resolve(null);
            }
        },
        subscribe(_msg, callback) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });
            /** @type {import('../../types/release-notes.js').ReleaseNotesMessages['subscriptions']['subscriptionEvent']} */
            const subscription = /** @type {any} */ (_msg.subscriptionName);
            switch (subscription) {
                case 'onUpdate': {
                    const searchParams = new URLSearchParams(window.location.search);
                    let stateId = searchParams.get('stateId');
                    if (!stateId || !sampleData[stateId]) {
                        stateId = 'loading';
                    }
                    let updateData = sampleData[stateId];

                    Object.entries(dataOverrides).forEach(([key, value]) => {
                        if (searchParams.has(key)) {
                            updateData = { ...updateData, ...value };
                        }
                    });

                    callback(sampleData.loading);

                    const timer = setTimeout(() => {
                        callback(updateData);
                    }, 1000);

                    return () => {
                        clearTimeout(timer);
                    };
                }
            }

            return () => {
                // any cleanup
            };
        },
    });
}
