import { h } from 'preact';
import { favoritesExamples } from '../favorites/components/Favorites.examples.js';
import { otherPrivacyStatsExamples, privacyStatsExamples } from '../privacy-stats/components/PrivacyStats.examples.js';
import { nextStepsExamples, otherNextStepsExamples } from '../next-steps/components/NextSteps.examples.js';
import { otherRMFExamples, RMFExamples } from '../remote-messaging-framework/components/RMF.examples.js';
import { customizerExamples } from '../customizer/components/Customizer.examples.js';
import { noop } from '../utils.js';
import { updateNotificationExamples } from '../update-notification/components/UpdateNotification.examples.js';
import { privacyProExamples } from '../privacy-pro/components/PrivacyPro.examples.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const mainExamples = {
    ...favoritesExamples,
    ...nextStepsExamples,
    ...privacyStatsExamples,
    ...RMFExamples,
    ...privacyProExamples,
};

export const otherExamples = {
    ...otherNextStepsExamples,
    ...otherPrivacyStatsExamples,
    ...otherRMFExamples,
    ...customizerExamples,
    ...updateNotificationExamples,
};
