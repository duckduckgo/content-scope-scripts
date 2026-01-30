/**
 * @import { NewsData } from "../../../types/new-tab";
 * @type {Record<string, NewsData>}
 */
export const newsMocks = {
    au: {
        results: [
            {
                title: 'Driver in custody after car crashes into Chabad World Headquarters in Brooklyn',
                url: 'https://example.com/brooklyn-crash',
                source: 'ABC News',
                relative_time: '25 minutes ago',
                excerpt: 'A driver is in custody after crashing into the Chabad World Headquarters.',
                image: 'https://placehold.co/80x56',
            },
            {
                title: 'Gas leak at UNL\'s East Campus quickly resolved, normal operations resume',
                url: 'https://example.com/gas-leak',
                source: '1011now.com',
                relative_time: '3 hours ago',
                excerpt: 'Emergency crews responded quickly to a gas leak on the university campus.',
                image: 'https://placehold.co/80x56',
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
                image: 'https://placehold.co/80x56',
            },
            {
                title: 'NASA announces new lunar mission timeline',
                url: 'https://example.com/nasa-moon',
                source: 'New York Times',
                relative_time: '3 hours ago',
                excerpt: 'Space agency reveals updated plans for Artemis program.',
                image: 'https://placehold.co/80x56',
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
                image: 'https://placehold.co/80x56',
            },
            {
                title: 'London Underground celebrates 160 years',
                url: 'https://example.com/tube-anniversary',
                source: 'The Guardian',
                relative_time: '2 hours ago',
                excerpt: "The world's oldest underground railway marks historic milestone.",
                image: 'https://placehold.co/80x56',
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
                image: 'https://placehold.co/80x56',
            },
            {
                title: 'New smartphone chip promises 50% battery improvement',
                url: 'https://example.com/new-chip',
                source: 'The Verge',
                relative_time: '3 hours ago',
                excerpt: 'Next-generation processors focus on power efficiency.',
                image: 'https://placehold.co/80x56',
            },
        ],
    },
    empty: {
        results: [],
    },
};
