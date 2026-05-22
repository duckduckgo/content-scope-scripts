/**
 * @typedef {import('../components/useSuggestions.js').SuggestionModel} SuggestionModel
 */

/** @type {SuggestionModel} */
const phraseSuggestion = { kind: 'phrase', phrase: 'pizza near me', id: 's-0' };

/** @type {SuggestionModel} */
const websiteSuggestion = { kind: 'website', url: 'https://pizzahut.com', id: 's-1' };

/** @type {SuggestionModel} */
const bookmarkSuggestion = {
    kind: 'bookmark',
    title: 'Pizza Hut',
    url: 'https://www.pizzahut.com/',
    isFavorite: true,
    id: 's-2',
    score: 95,
};

/** @type {SuggestionModel} */
const historySuggestion = {
    kind: 'historyEntry',
    title: 'Best Pizza Places in New York',
    url: 'https://example.com/search?q=Best%20Pizza%20Places%20in%20New%20York',
    id: 's-3',
    score: 90,
};

/** @type {SuggestionModel} */
const openTabSuggestion = { kind: 'openTab', title: 'Chicago vs New York Pizza', tabId: 'tab-1', id: 's-4', score: 85 };

/** @type {SuggestionModel} */
const internalPageSuggestion = { kind: 'internalPage', title: 'DuckDuckGo Settings', url: 'duck://settings', id: 's-5', score: 80 };

/** @type {SuggestionModel} */
const aiChatSuggestion = { kind: 'aiChat', chat: 'pizza', id: 's-6' };

export const suggestions = {
    /** @type {SuggestionModel[]} */
    allTypes: [
        phraseSuggestion,
        websiteSuggestion,
        bookmarkSuggestion,
        historySuggestion,
        openTabSuggestion,
        internalPageSuggestion,
        aiChatSuggestion,
    ],

    /** @type {SuggestionModel} */
    shortTitleShortSuffix: { ...bookmarkSuggestion, isFavorite: false, id: 'ss-0' },
    /** @type {SuggestionModel} */
    shortTitleLongSuffix: {
        kind: 'historyEntry',
        title: 'Pizza',
        url: 'https://www.pizzahut.com/menu/pizza/original-stuffed-crust/pepperoni-lovers-stuffed-crust',
        id: 'ss-1',
        score: 90,
    },
    /** @type {SuggestionModel} */
    longTitleShortSuffix: {
        kind: 'historyEntry',
        title: 'Pizza Planet: Over a billion reviews & contributions for Hotels, Attractions, Restaurants, and more',
        url: 'https://www.pizzaplanet.com/',
        id: 'ss-2',
        score: 90,
    },
    /** @type {SuggestionModel} */
    longTitleLongSuffix: {
        kind: 'historyEntry',
        title: 'Pizza Planet: Over a billion reviews & contributions for Hotels, Attractions, Restaurants, and more',
        url: 'https://www.pizzaplanet.com/Hotels-Attractions-Restaurants-and-more/reviews?sort=recent&lang=en',
        id: 'ss-3',
        score: 90,
    },

    /** @type {SuggestionModel} */
    shortCompletionShortSuffix: {
        kind: 'historyEntry',
        title: 'Pizza Hut Menu',
        url: 'https://www.pizzahut.com/',
        id: 'i-0',
        score: 90,
    },
    /** @type {SuggestionModel} */
    shortCompletionLongSuffix: {
        kind: 'historyEntry',
        title: 'Pizza Planet: Over a billion reviews & contributions for Hotels, Attractions, Restaurants, and more',
        url: 'https://www.pizzaplanet.com/',
        id: 'i-1',
        score: 90,
    },
    /** @type {SuggestionModel} */
    longCompletionShortSuffix: {
        kind: 'historyEntry',
        title: 'Pizza Hut',
        url: 'https://www.pizzahut.com/menu/pizza/original-stuffed-crust/pepperoni-lovers',
        id: 'i-2',
        score: 90,
    },
    /** @type {SuggestionModel} */
    longCompletionLongSuffix: {
        kind: 'historyEntry',
        title: 'Pizza Planet: Over a billion reviews & contributions for Hotels, Attractions, Restaurants, and more',
        url: 'https://www.pizzaplanet.com/Hotels-Attractions-Restaurants-and-more/reviews?sort=recent&lang=en',
        id: 'i-3',
        score: 90,
    },
};
