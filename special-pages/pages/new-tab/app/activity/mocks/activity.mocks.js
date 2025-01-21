/**
 * @import { ActivityData } from "../../../types/new-tab";
 * @type {Record<string, ActivityData>}
 */
export const activityMocks = {
    few: {
        activity: [
            {
                entityId: '550e8400-e29b-41d4-a716-446655440000',
                favicon: 'selco-icon.png',
                domain: 'selcobw.com',
                title: 'Toilets, Cubicles, Cisterns & Urinals | Selco',
                trackingStatus: {
                    trackers: ['Google', 'DuckDuckGo'],
                    trackerCount: 56,
                },
                history: [
                    {
                        title: '/bathrooms/toilets',
                        url: 'https://selcobw.com/bathrooms/toilets',
                        timestamp: '2025-01-21T10:39:00Z',
                        relativeTime: '21 mins ago',
                    },
                    {
                        title: 'Homepage',
                        url: 'https://selcobw.com',
                        timestamp: '2025-01-21T10:39:00Z',
                        relativeTime: '21 mins ago',
                    },
                ],
            },
            {
                entityId: '550e8400-e29b-41d4-a716-446655440001',
                favicon: 'youtube-icon.png',
                domain: 'youtube.com',
                title: 'YouTube',
                trackingStatus: {
                    trackers: [],
                    trackerCount: 0,
                },
                history: [
                    {
                        title: 'YouTube',
                        url: 'https://youtube.com',
                        timestamp: '2025-01-18T10:00:00Z',
                        relativeTime: '3 days ago',
                    },
                ],
            },
        ],
    },
};
