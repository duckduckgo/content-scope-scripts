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
        { title: 'Best Pizza Places in New York' },
        { title: 'Pizza Making Tips and Tricks' },
        { title: 'Italian Pizza History' },
        { title: 'Homemade Pizza Guide' },
        { title: 'Pizza Dough Calculator' },
        {
            title: 'Pizza Planet: Over a billion reviews & contributions for Hotels, Attractions, Restaurants, and more',
            url: 'https://www.pizzaplanet.com/',
        },
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
                    .filter((entry) => containsIgnoreCase(entry.title, term))
                    .map((entry) => ({
                        kind: /** @type {const} */ ('historyEntry'),
                        title: entry.title,
                        url: entry.url || `https://example.com/search?q=${encodeURIComponent(entry.title)}`,
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
        pinned: true,
        lastEdit: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        chatId: 'chat-002',
        title: 'Progression plan summary Progression plan summary Progression plan summary Progression plan summary Progression plan summary',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        model: 'voice-mode',
    },
    {
        chatId: 'chat-003',
        title: mockAiChatTitleWithSearchTerm,
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        model: 'gpt-4o-mini',
    },
    {
        chatId: 'chat-004',
        title: 'Tomato ideas',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        model: 'image-generation',
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
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    },
    {
        chatId: 'chat-007',
        title: 'Team retro & action items',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
    {
        chatId: 'chat-008',
        title: 'Migration plan for legacy services',
        pinned: false,
        lastEdit: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    },
];

/**
 * @param {string} [query]
 * @return {import("../../../types/new-tab").AiChatsData}
 */
export function getMockAiChats(query) {
    const trimmed = (query ?? '').trim().toLowerCase();
    const filtered = trimmed ? allMockChats.filter((chat) => chat.title.toLowerCase().includes(trimmed)) : allMockChats;
    return { chats: filtered.slice(0, MAX_RESULTS) };
}

/**
 * Local bundled icon so the tab picker renders deterministically in screenshot
 * tests — real favicon URLs would race a live network fetch.
 * @param {string} file - filename under `public/company-icons/`
 * @returns {import("../../../types/new-tab").Favicon}
 */
function localFavicon(file) {
    return { src: `./company-icons/${file}`, maxAvailableSize: 64 };
}

/** @type {import("../../../types/new-tab").TabMetadata[]} */
const allMockOpenTabs = [
    {
        tabId: 'tab-1',
        title: 'MacBook Neo - Apple',
        url: 'https://www.apple.com/macbook-neo',
        favicon: localFavicon('a.svg'),
    },
    {
        tabId: 'tab-2',
        title: 'Starbucks Coffee Company',
        url: 'https://www.starbucks.com',
        favicon: localFavicon('s.svg'),
    },
    {
        tabId: 'tab-long',
        title: 'Breckenreid Makes Thoughtful Illustrations About Typography, History, And Why Extremely Long Page Titles Must Be Truncated With An Ellipsis Instead Of Wrapping Or Overflowing The Picker',
        url: 'https://example.com/an/extremely/long/article/about/typography',
        favicon: localFavicon('e.svg'),
    },
    {
        tabId: 'tab-3',
        title: 'MacBook Pro - Apple',
        url: 'https://www.apple.com/macbook-pro',
        favicon: localFavicon('a.svg'),
    },
    {
        tabId: 'tab-4',
        title: 'Duck.ai - Project planning',
        url: 'https://duck.ai/chat/abc',
        favicon: localFavicon('d.svg'),
    },
    {
        tabId: 'tab-5',
        title: 'Dinosaurus',
        url: 'https://en.wikipedia.org/wiki/Dinosaur',
        favicon: localFavicon('w.svg'),
    },
    {
        tabId: 'tab-6',
        title: 'Amazon.com. Spend less. Smile more.',
        url: 'https://www.amazon.com',
        favicon: localFavicon('amazon.svg'),
    },
    {
        tabId: 'tab-7',
        title: 'Daring Fireball',
        url: 'https://daringfireball.net',
        favicon: localFavicon('d.svg'),
    },
    {
        tabId: 'tab-8',
        title: 'Ranking MLB best at every position',
        url: 'https://www.mlb.com/news/best-players-position',
        favicon: localFavicon('m.svg'),
    },
    {
        tabId: 'tab-9',
        title: 'Asana',
        url: 'https://app.asana.com',
        favicon: localFavicon('a.svg'),
    },
    {
        tabId: 'tab-10',
        title: 'Discord',
        url: 'https://discord.com/channels/@me',
        favicon: localFavicon('d.svg'),
    },
    {
        tabId: 'tab-11',
        title: 'The Verge',
        url: 'https://www.theverge.com',
        favicon: localFavicon('t.svg'),
    },
    {
        tabId: 'tab-12',
        title: 'BlueSky',
        url: 'https://bsky.app',
        favicon: localFavicon('b.svg'),
    },
    {
        tabId: 'tab-broken',
        title: 'Tab That Fails to Extract',
        url: 'https://example.invalid/restricted',
        favicon: null,
    },
];

/**
 * @returns {import("../../../types/new-tab").GetOpenTabsResponse}
 */
export function getMockOpenTabs() {
    return { tabs: allMockOpenTabs };
}

/**
 * @param {string} tabId
 * @returns {import("../../../types/new-tab").PageContext | null}
 */
export function getMockTabContent(tabId) {
    if (tabId === 'tab-broken') return null;
    const tab = allMockOpenTabs.find((t) => t.tabId === tabId);
    if (!tab) return null;
    const content = `## ${tab.title}\n\nMock markdown content extracted from ${tab.url}.\n\nThis is placeholder content used by the NTP mock transport so the attach-tabs feature can be exercised without a native backend.`;
    return {
        tabId: tab.tabId,
        title: tab.title,
        url: tab.url,
        favicon: tab.favicon,
        content,
        truncated: false,
        fullContentLength: content.length,
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
