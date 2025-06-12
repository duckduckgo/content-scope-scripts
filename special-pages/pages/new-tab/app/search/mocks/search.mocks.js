export const searchMocks = {
    basic: {
        topHits: [
            {
                kind: 'bookmark',
                title: 'DuckDuckGo Search Engine',
                url: 'https://duckduckgo.com',
                isFavorite: true,
                score: 98,
            },
            {
                kind: 'openTab',
                title: 'GitHub - Version Control',
                url: 'https://github.com',
                tabId: 'tab-456-def',
                score: 95,
            },
        ],
        duckduckgoSuggestions: [
            {
                kind: 'phrase',
                phrase: 'best pizza recipe',
            },
            {
                kind: 'website',
                url: 'https://www.example.com',
            },
        ],
        localSuggestions: [
            {
                kind: 'historyEntry',
                title: 'Stack Overflow - Programming Q&A',
                url: 'https://stackoverflow.com',
                score: 87,
            },
            {
                kind: 'internalPage',
                title: 'Settings',
                url: 'duckduckgo://settings',
                score: 80,
            },
        ],
    },
    manySuggestions: {
        topHits: [
            {
                kind: 'phrase',
                phrase: 'best pizza recipe',
            },
        ],
        localSuggestions: [],
    },
    generateSuggestions: getMockSuggestions,
};

const pizzaRelatedData = {
    phrases: [
        'pizza near me',
        'pizza delivery',
        'pizza hut',
        'pizza recipes',
        'pizza express',
        'pizza dough recipe',
        'pizza marinara',
        'pizza margherita',
        'pizzeria italiano',
        'pizza places open now',
        'pizza express menu',
        'pizza toppings',
        'pizza sauce recipe',
        'pizza napoletana',
        'pizza pasta',
    ],
    websites: ['pizzahut.com', 'dominos.com', 'papajohns.com', 'littlecaesars.com', 'pizzaexpress.com'],
    historyEntries: [
        'Best Pizza Places in New York',
        'Pizza Making Tips and Tricks',
        'Italian Pizza History',
        'Homemade Pizza Guide',
        'Pizza Dough Calculator',
    ],
};

/**
 * @param {string} searchTerm
 * @return {import("../../../types/new-tab").SuggestionsData}
 */
export function getMockSuggestions(searchTerm) {
    const term = searchTerm.toLowerCase();
    return {
        suggestions: {
            topHits: pizzaRelatedData.phrases
                .filter((phrase) => phrase.toLowerCase().includes(term))
                .slice(0, 3)
                .map((phrase) => ({
                    kind: /** @type {const} */ ('phrase'),
                    phrase,
                    score: 95 + Math.floor(Math.random() * 5),
                })),
            duckduckgoSuggestions: [
                ...pizzaRelatedData.phrases
                    .filter((phrase) => phrase.toLowerCase().includes(term))
                    .slice(3, 8)
                    .map((phrase) => ({
                        kind: /** @type {const} */ ('phrase'),
                        phrase,
                    })),
                ...pizzaRelatedData.websites
                    .filter((site) => site.toLowerCase().includes(term))
                    .map((url) => ({
                        kind: /** @type {const} */ ('website'),
                        url: `https://${url}`,
                    })),
            ],
            localSuggestions: pizzaRelatedData.historyEntries
                .filter((title) => title.toLowerCase().includes(term))
                .map((title) => ({
                    kind: /** @type {const} */ ('historyEntry'),
                    title,
                    url: `https://example.com/search?q=${encodeURIComponent(title)}`,
                    score: 80 + Math.floor(Math.random() * 10),
                })),
        },
    };
}

// console.log(getMockSuggestions('p'));
// console.log(getMockSuggestions('pizza d'));
