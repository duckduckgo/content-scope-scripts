import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { SubscriptionWinBackBannerConsumer } from '../subscription-winback-banner/components/SubscriptionWinBackBanner.js';
import { SubscriptionWinBackBannerProvider } from '../subscription-winback-banner/SubscriptionWinBackBannerProvider.js';

export function factory() {
    return (
        <Centered data-entry-point="subscriptionWinBackBanner">
            <SubscriptionWinBackBannerProvider>
                <SubscriptionWinBackBannerConsumer />
            </SubscriptionWinBackBannerProvider>
        </Centered>
    );
}
