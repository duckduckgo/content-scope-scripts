import { h } from 'preact';
import { noop } from '../../utils.js';
import { SubscriptionWinBackBanner } from './SubscriptionWinBackBanner.js';
import { subscriptionWinBackBannerDataExamples } from '../mocks/subscriptionWinBackBanner.data.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const subscriptionWinBackBannerExamples = {
    'subscriptionWinBackBanner.winback_last_day': {
        factory: () => (
            <SubscriptionWinBackBanner
                message={subscriptionWinBackBannerDataExamples.winback_last_day.content}
                dismiss={noop('winBackOffer_dismiss')}
                action={noop('winBackOffer_action')}
            />
        ),
    },
};
