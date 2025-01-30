import { h } from 'preact';
import { ActivityMockProvider } from '../mocks/ActivityMockProvider.js';
import { ActivityConsumer } from './Activity.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const activityExamples = {
    'stats.few': {
        factory: () => (
            <ActivityMockProvider ticker={true}>
                <ActivityConsumer />
            </ActivityMockProvider>
        ),
    },
    'stats.few.collapsed': {
        factory: () => (
            <ActivityMockProvider config={{ expansion: 'collapsed' }}>
                <ActivityConsumer />
            </ActivityMockProvider>
        ),
    },
    // 'stats.single': {
    //     factory: () => (
    //         <ActivityMockProvider data={activityMocks.single}>
    //             <ActivityConsumer />
    //         </ActivityMockProvider>
    //     ),
    // },
    // 'stats.none': {
    //     factory: () => (
    //         <ActivityMockProvider data={activityMocks.none}>
    //             <ActivityConsumer />
    //         </ActivityMockProvider>
    //     ),
    // },
    // 'stats.norecent': {
    //     factory: () => (
    //         <ActivityMockProvider data={activityMocks.norecent}>
    //             <ActivityConsumer />
    //         </ActivityMockProvider>
    //     ),
    // },
};
