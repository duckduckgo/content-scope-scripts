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
    openTabs: ['Chicago vs New York Pizza'],
};

/**
 * @param {string} term
 * @return {import("../../../types/new-tab").SuggestionsData}
 */
export function getMockSuggestions(term) {
    return {
        suggestions: {
            topHits: pizzaRelatedData.phrases
                .filter((phrase) => containsIgnoreCase(phrase, term))
                .slice(0, 3)
                .map((phrase) => ({
                    kind: /** @type {const} */ ('phrase'),
                    phrase,
                    score: random(95, 99),
                })),
            duckduckgoSuggestions: [
                ...pizzaRelatedData.websites
                    .filter((phrase) => containsIgnoreCase(phrase, term))
                    .slice(0, 2)
                    .map((website, index) => ({
                        kind: /** @type {const} */ ('bookmark'),
                        title: website,
                        url: website,
                        isFavorite: index === 0,
                        score: random(95, 99),
                    })),
                ...pizzaRelatedData.phrases
                    .filter((phrase) => containsIgnoreCase(phrase, term))
                    .slice(3, 8)
                    .map((phrase) => ({
                        kind: /** @type {const} */ ('phrase'),
                        phrase,
                    })),
                ...pizzaRelatedData.websites
                    .filter((site) => containsIgnoreCase(site, term))
                    .map((url) => ({
                        kind: /** @type {const} */ ('website'),
                        url: `https://${url}`,
                    })),
            ],
            localSuggestions: [
                ...pizzaRelatedData.historyEntries
                    .filter((title) => containsIgnoreCase(title, term))
                    .map((title) => ({
                        kind: /** @type {const} */ ('historyEntry'),
                        title,
                        url: `https://example.com/search?q=${encodeURIComponent(title)}`,
                        score: random(80, 89),
                    })),
                ...pizzaRelatedData.openTabs
                    .filter((title) => containsIgnoreCase(title, term))
                    .map((title) => ({
                        kind: /** @type {const} */ ('openTab'),
                        title,
                        tabId: `tab-${random(1000, 9999)}`,
                        score: random(80, 89),
                    })),
            ],
        },
    };
}

/**
 * @return {import("../../../types/new-tab").AiChatsData}
 */
export function getMockAiChats() {
    return {
        chats: [
            {
                chatId: 'chat-001',
                title: 'Edit: feedback quality and timing',
                isPinned: true,
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
            {
                chatId: 'chat-002',
                title: 'Progression plan summary',
                isPinned: false,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            },
            {
                chatId: 'chat-003',
                title: 'Onboarding milestones overview',
                isPinned: false,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            },
            {
                chatId: 'chat-004',
                title: 'Share knowledge effectively.',
                isPinned: false,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            },
            {
                chatId: 'chat-005',
                title: 'Rubrics for O-X projects',
                isPinned: false,
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            },
        ],
    };
}

/**
 * @param {string} text
 * @param {string} searchTerm
 * @returns {boolean}
 */
function containsIgnoreCase(text, searchTerm) {
    return text.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function random(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}
