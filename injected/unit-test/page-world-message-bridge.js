import { NotificationMessage, TestTransportConfig } from '@duckduckgo/messaging';

describe('page-world bridge hardening', () => {
    it('preserves the requested context when proxy installs are forwarded', async () => {
        const { MessageBridge } = await import(`../src/features/message-bridge.js?test=${Math.random()}`);
        const { InstallProxy } = await import(`../src/features/message-bridge/schema.js?test=${Math.random()}`);

        const notify = jasmine.createSpy('notify').and.returnValue(Promise.resolve());
        const bridge = new MessageBridge(
            'messageBridge',
            {},
            {},
            {
                platform: { name: 'macos' },
                site: { enabledFeatures: ['pageContext'] },
            },
        );

        bridge._messaging = {
            messagingContext: {
                context: 'contentScopeScriptsIsolated',
                featureName: 'messageBridge',
                env: 'development',
            },
        };

        bridge.installProxyFor(
            new InstallProxy({
                featureName: 'pageContext',
                id: 'proxy-id',
                context: 'contentScopeScripts',
            }),
            new TestTransportConfig({
                notify,
                request: () => Promise.resolve(null),
                subscribe: () => () => {},
            }),
            () => {},
        );

        const proxy = bridge.proxies.get('pageContext');
        expect(proxy).toBeDefined();

        await proxy.notify('collect', {});

        expect(notify).toHaveBeenCalledWith(
            new NotificationMessage({
                context: 'contentScopeScripts',
                featureName: 'pageContext',
                method: 'collect',
                params: {},
            }),
        );
    });
});
