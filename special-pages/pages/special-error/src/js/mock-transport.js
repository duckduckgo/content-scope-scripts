import { TestTransportConfig } from '@duckduckgo/messaging';
import { sampleData } from './sampleData';

export function mockTransport() {
    return new TestTransportConfig({
        notify(_msg) {},
        request(_msg) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });

            const searchParams = new URLSearchParams(window.location.search);
            let errorId = searchParams.get('errorId');
            if (!errorId || !sampleData[errorId]) {
                errorId = 'ssl.invalid';
            }

            /** @type {import('../../types/special-error').SpecialErrorMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'initialSetup': {
                    const searchParams = new URLSearchParams(window.location.search);
                    const errorId = searchParams.get('errorId');
                    const platformName = searchParams.get('platformName');

                    /** @type {import('../../types/special-error').InitialSetupResponse['errorData']} */
                    let errorData = sampleData['ssl.expired'].data;
                    if (errorId && Object.keys(sampleData).includes(errorId)) {
                        errorData = sampleData[errorId].data;
                    }

                    const supportedPlatforms = ['macos', 'ios'];
                    /** @type {import('../../types/special-error').InitialSetupResponse['platform']} */
                    let platform = { name: 'macos' };
                    if (platformName && supportedPlatforms.includes(platformName)) {
                        platform = {
                            name: /** @type {import('../../types/special-error').InitialSetupResponse['platform']['name']} */ (
                                platformName
                            ),
                        };
                    }

                    return Promise.resolve({
                        env: 'development',
                        locale: 'en',
                        platform,
                        errorData,
                    });
                }
                default:
                    return Promise.resolve(null);
            }
        },
        subscribe(_msg, callback) {
            window.__playwright_01?.mocks?.outgoing?.push?.({ payload: structuredClone(_msg) });

            return () => {
                // any cleanup
            };
        },
    });
}
