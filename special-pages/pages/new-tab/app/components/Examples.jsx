import { customizerExamples } from '../customizer/components/Customizer.examples.js';
import { favoritesExamples } from '../favorites/components/Favorites.examples.js';
import { freemiumPIRBannerExamples } from '../freemium-pir-banner/components/FreemiumPIRBanner.examples.js';
import { nextStepsExamples, otherNextStepsExamples } from '../next-steps/components/NextSteps.examples.js';
import { otherPrivacyStatsExamples, privacyStatsExamples } from '../privacy-stats/components/PrivacyStats.examples.js';
import { otherRMFExamples, RMFExamples } from '../remote-messaging-framework/components/RMF.examples.js';
import { updateNotificationExamples } from '../update-notification/components/UpdateNotification.examples.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const mainExamples = {
    ...favoritesExamples,
    ...freemiumPIRBannerExamples,
    ...nextStepsExamples,
    ...privacyStatsExamples,
    ...RMFExamples,
};

export const otherExamples = {
    ...otherNextStepsExamples,
    ...otherPrivacyStatsExamples,
    ...otherRMFExamples,
    ...customizerExamples,
    ...updateNotificationExamples,
};
