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

export const mockAiChatsSearchTerm = 'milestone';
export const mockAiChatTitleWithSearchTerm = `Onboarding ${mockAiChatsSearchTerm}s overview`;

const MAX_RESULTS = 5;

/** @type {import("../../../types/new-tab").AiChat[]} */
const allMockChats = [
    {
        chatId: 'chat-001',
        title: 'Edit: feedback quality & timing',
        firstUserMessageContent: 'What is the feedback quality & timing?',
        pinned: true,
        lastEdit: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        chatId: 'chat-002',
        title: 'Progression plan summary Progression plan summary Progression plan summary Progression plan summary Progression plan summary',
        firstUserMessageContent: 'Help me create a career progression plan for my team',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        chatId: 'chat-003',
        title: mockAiChatTitleWithSearchTerm,
        firstUserMessageContent: 'What are the key milestones for onboarding new employees?',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
        chatId: 'chat-004',
        title: 'Share knowledge effectively.',
        firstUserMessageContent: 'Share knowledge effectively.',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
        chatId: 'chat-005',
        title: 'Rubrics for O-X projects',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    },
    {
        chatId: 'chat-006',
        title: 'Budget forecast Q3 review',
        firstUserMessageContent: 'Can you help me review and forecast the Q3 budget?',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    },
    {
        chatId: 'chat-007',
        title: 'Team retro & action items',
        firstUserMessageContent: 'Summarize our last team retro and list action items',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
    {
        chatId: 'chat-008',
        title: 'Migration plan for legacy services',
        firstUserMessageContent: 'Help me plan the migration of our legacy services to the new platform',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    },
];

/**
 * Returns the expected visible text for an AI chat item.
 * Mirrors the display logic in AiChatsList.js.
 * @param {import("../../../types/new-tab").AiChat} chat
 * @returns {string}
 */
export function getExpectedAiChatText(chat) {
    if (chat.firstUserMessageContent && chat.firstUserMessageContent.toLowerCase() !== chat.title.toLowerCase()) {
        return `${chat.title} - "${chat.firstUserMessageContent}"`;
    }
    return chat.title;
}

/**
 * @param {string} [query]
 * @return {import("../../../types/new-tab").AiChatsData}
 */
export function getMockAiChats(query) {
    const trimmed = (query ?? '').trim().toLowerCase();
    const filtered = trimmed
        ? allMockChats.filter(
              (chat) =>
                  chat.title.toLowerCase().includes(trimmed) ||
                  (chat.firstUserMessageContent && chat.firstUserMessageContent.toLowerCase().includes(trimmed)),
          )
        : allMockChats;
    return { chats: filtered.slice(0, MAX_RESULTS) };
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
