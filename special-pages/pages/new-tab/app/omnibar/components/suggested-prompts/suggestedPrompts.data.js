import {
    ChartIcon,
    ChatsIcon,
    CreditCardIcon,
    DarkThemeIcon,
    EditIcon,
    EmailIcon,
    GlobeIcon,
    HomeIcon,
    KeyLoginIcon,
    LightThemeIcon,
    PaidIcon,
    PuzzleIcon,
} from './SuggestedPromptsIcons.js';

/**
 * Ported from Duck.ai's new-chat chips (www-release/frontend/react/src/duckai/components/buttons/new-chat-chips).
 *
 * @typedef {typeof import('../../strings.json')} Strings
 * @typedef {keyof Strings} StringKey
 * @typedef {import('preact').FunctionComponent<import('preact').JSX.SVGAttributes<SVGSVGElement>>} IconComponent
 * @typedef {{ kind: 'text', id: string, label: StringKey, prompt: string, Icon: IconComponent }} TextPrompt
 * @typedef {{ kind: 'image', id: string, label: StringKey, prompt: string, image: string, hoverImage: string, mode: 'send' | 'open-file-picker' }} ImagePrompt
 * @typedef {TextPrompt | ImagePrompt} Prompt
 * @typedef {'how-duckai-works' | 'suggestions' | 'create-image'} TabId
 */

// The prompt sent to the model stays in English, as on Duck.ai; only the visible label is localized.
const DEFAULT_TEXT_PROMPT =
    '. If needed, ask me 1-2 questions that I can answer in just a few words - to help guide me to the most useful information. Speak in a conversational way, and ensure the response is easy for me to understand.';

/**
 * @param {string} id
 * @param {StringKey} label
 * @param {string} topic
 * @param {IconComponent} Icon
 * @returns {TextPrompt}
 */
function textPrompt(id, label, topic, Icon) {
    return { kind: 'text', id, label, prompt: topic + DEFAULT_TEXT_PROMPT, Icon };
}

export const TEXT_PROMPTS_PER_PAGE = 4;

/**
 * In default display order. Submitted prompts move to the end (see `orderPrompts`), then the list is paged.
 * @type {TextPrompt[]}
 */
export const TEXT_PROMPTS = [
    textPrompt('jobapplication', 'omnibar_suggestedPromptsTextJobApplication', 'Improve a job application', EditIcon),
    textPrompt('homefix', 'omnibar_suggestedPromptsTextHomeFix', 'Fix something in my home', HomeIcon),
    textPrompt('financialterms', 'omnibar_suggestedPromptsTextFinancialTerms', 'Understand common financial terms', PaidIcon),
    textPrompt('fitnessplan', 'omnibar_suggestedPromptsTextFitnessPlan', 'Build a fitness plan', ChartIcon),
    textPrompt('writeemail', 'omnibar_suggestedPromptsTextWriteEmail', 'Write an important email', EmailIcon),
    textPrompt('plantrip', 'omnibar_suggestedPromptsTextPlanTrip', 'Plan an upcoming trip', GlobeIcon),
    textPrompt('buyinghouse', 'omnibar_suggestedPromptsTextBuyingHouse', 'Learn about buying a house', KeyLoginIcon),
    textPrompt('gettingfit', 'omnibar_suggestedPromptsTextGettingFit', 'Tips to start getting fit', LightThemeIcon),
    textPrompt(
        'difficultconversation',
        'omnibar_suggestedPromptsTextDifficultConversation',
        'Prepare for a difficult conversation',
        ChatsIcon,
    ),
    textPrompt('newskill', 'omnibar_suggestedPromptsTextNewSkill', 'Learn a new skill', PuzzleIcon),
    textPrompt('moneyhabits', 'omnibar_suggestedPromptsTextMoneyHabits', 'Develop better money habits', CreditCardIcon),
    textPrompt('improvesleep', 'omnibar_suggestedPromptsTextImproveSleep', 'Improve my sleep', DarkThemeIcon),
];

/** @type {ImagePrompt[]} */
export const IMAGE_PROMPTS = [
    {
        kind: 'image',
        id: 'createcomic',
        label: 'omnibar_suggestedPromptsImageCreateComic',
        prompt: 'Draw a comic-style illustration of a duck shredding some confidential information.',
        image: './suggested-prompts/thumbnail-comic-default.jpg',
        hoverImage: './suggested-prompts/thumbnail-comic-hover.jpg',
        mode: 'send',
    },
    {
        kind: 'image',
        id: 'designspace',
        label: 'omnibar_suggestedPromptsImageDesignSpace',
        prompt: 'Visualize a modern living room space.',
        image: './suggested-prompts/thumbnail-space-default.jpg',
        hoverImage: './suggested-prompts/thumbnail-space-hover.jpg',
        mode: 'send',
    },
    {
        kind: 'image',
        id: 'editphoto',
        label: 'omnibar_suggestedPromptsImageEditPhoto',
        prompt: '',
        image: './suggested-prompts/thumbnail-photo-default.jpg',
        hoverImage: './suggested-prompts/thumbnail-photo-hover.jpg',
        mode: 'open-file-picker',
    },
];

/** @type {{ icon: string, title: StringKey, body: StringKey }[]} */
export const HOW_DUCKAI_WORKS_CARDS = [
    {
        icon: './suggested-prompts/duckai-chat-56.svg',
        title: 'omnibar_suggestedPromptsChatTitle',
        body: 'omnibar_suggestedPromptsChatBody',
    },
    {
        icon: './suggested-prompts/mask-green-56.svg',
        title: 'omnibar_suggestedPromptsAnonymizedTitle',
        body: 'omnibar_suggestedPromptsAnonymizedBody',
    },
    {
        icon: './suggested-prompts/fire-56.svg',
        title: 'omnibar_suggestedPromptsNoAiTrainingTitle',
        body: 'omnibar_suggestedPromptsNoAiTrainingBody',
    },
];
