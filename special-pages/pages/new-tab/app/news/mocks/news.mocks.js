/**
 * @import { NewsData } from "../../../types/new-tab";
 * @type {Record<string, NewsData>}
 */
export const newsMocks = {
    au: {
        results: [
            {
                title: 'Sydney Opera House celebrates 50th anniversary with special light show',
                url: 'https://example.com/sydney-opera-house',
                source: 'Sydney Morning Herald',
                relative_time: '2 hours ago',
                excerpt: 'The iconic Sydney Opera House marks half a century with a spectacular display.',
                image: 'https://example.com/images/opera-house.jpg',
            },
            {
                title: 'Australian Open tennis finals set for weekend showdown',
                url: 'https://example.com/aus-open',
                source: 'The Australian',
                relative_time: '4 hours ago',
                excerpt: 'Top seeds advance to finals in Melbourne as excitement builds.',
                image: 'https://example.com/images/tennis.jpg',
            },
            {
                title: 'Great Barrier Reef shows signs of recovery',
                url: 'https://example.com/reef-recovery',
                source: 'ABC News',
                relative_time: '6 hours ago',
                excerpt: 'Scientists report positive trends in coral regeneration efforts.',
                image: 'https://example.com/images/reef.jpg',
            },
        ],
    },
    us: {
        results: [
            {
                title: 'Tech stocks rally as earnings season begins',
                url: 'https://example.com/tech-stocks',
                source: 'Wall Street Journal',
                relative_time: '1 hour ago',
                excerpt: 'Major technology companies exceed analyst expectations.',
                image: 'https://example.com/images/stocks.jpg',
            },
            {
                title: 'NASA announces new lunar mission timeline',
                url: 'https://example.com/nasa-moon',
                source: 'New York Times',
                relative_time: '3 hours ago',
                excerpt: 'Space agency reveals updated plans for Artemis program.',
                image: 'https://example.com/images/moon.jpg',
            },
            {
                title: 'Electric vehicle sales hit record high in Q4',
                url: 'https://example.com/ev-sales',
                source: 'Reuters',
                relative_time: '5 hours ago',
                excerpt: 'Consumer demand for EVs continues to surge nationwide.',
                image: 'https://example.com/images/ev.jpg',
            },
        ],
    },
    uk: {
        results: [
            {
                title: 'Premier League title race heats up',
                url: 'https://example.com/premier-league',
                source: 'BBC Sport',
                relative_time: '30 minutes ago',
                excerpt: 'Top four teams separated by just three points.',
                image: 'https://example.com/images/football.jpg',
            },
            {
                title: 'London Underground celebrates 160 years',
                url: 'https://example.com/tube-anniversary',
                source: 'The Guardian',
                relative_time: '2 hours ago',
                excerpt: "The world's oldest underground railway marks historic milestone.",
                image: 'https://example.com/images/tube.jpg',
            },
            {
                title: 'British scientists make breakthrough in renewable energy',
                url: 'https://example.com/renewable-energy',
                source: 'The Times',
                relative_time: '4 hours ago',
                excerpt: 'New solar technology promises higher efficiency at lower cost.',
                image: 'https://example.com/images/solar.jpg',
            },
        ],
    },
    tech: {
        results: [
            {
                title: 'AI chatbots transform customer service industry',
                url: 'https://example.com/ai-chatbots',
                source: 'TechCrunch',
                relative_time: '1 hour ago',
                excerpt: 'Companies report significant improvements in response times.',
                image: 'https://example.com/images/ai.jpg',
            },
            {
                title: 'New smartphone chip promises 50% battery improvement',
                url: 'https://example.com/new-chip',
                source: 'The Verge',
                relative_time: '3 hours ago',
                excerpt: 'Next-generation processors focus on power efficiency.',
                image: 'https://example.com/images/chip.jpg',
            },
            {
                title: 'Cloud computing market to double by 2027',
                url: 'https://example.com/cloud-growth',
                source: 'Ars Technica',
                relative_time: '5 hours ago',
                excerpt: 'Industry analysts predict continued rapid expansion.',
                image: 'https://example.com/images/cloud.jpg',
            },
        ],
    },
    empty: {
        results: [],
    },
};
