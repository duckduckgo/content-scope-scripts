import { h } from 'preact';
import { favoritesExamples } from '../favorites/components/FavoritesExamples.js';
import { otherPrivacyStatsExamples, privacyStatsExamples } from '../privacy-stats/components/PrivacyStatsExamples.js';
import { nextStepsExamples, otherNextStepsExamples } from '../next-steps/components/NextStepsExamples.js';
import { otherRMFExamples, RMFExamples } from '../remote-messaging-framework/components/RMFExamples.js';
import { customizerExamples } from '../customizer/components/CustomizerExamples.js';
import { noop } from '../utils.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const mainExamples = {
    ...favoritesExamples,
    ...nextStepsExamples,
    ...privacyStatsExamples,
    ...RMFExamples,
};

export const otherExamples = {
    ...otherNextStepsExamples,
    ...otherPrivacyStatsExamples,
    ...otherRMFExamples,
    ...customizerExamples,
};
