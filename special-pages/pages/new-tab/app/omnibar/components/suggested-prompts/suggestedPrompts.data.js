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
 * Ported from Duck.ai's new-chat chips
 *
 * @typedef {typeof import('../../strings.json')} Strings
 * @typedef {keyof Strings} StringKey
 * @typedef {import('preact').FunctionComponent<import('preact').JSX.SVGAttributes<SVGSVGElement>>} IconComponent
 * @typedef {{ kind: 'text', id: string, label: StringKey, Icon: IconComponent }} TextPrompt - Sends `label` wrapped in `omnibar_suggestedPromptsTextPromptTemplate`.
 * @typedef {{ kind: 'image', id: string, label: StringKey, image: string, hoverImage: string }} ImagePromptBase
 * @typedef {ImagePromptBase & ({ mode: 'send', prompt: StringKey } | { mode: 'open-file-picker' })} ImagePrompt
 * @typedef {TextPrompt | ImagePrompt} Prompt
 * @typedef {'how-duckai-works' | 'suggestions' | 'create-image'} TabId
 */

/** @type {TextPrompt[][]} */
export const TEXT_PROMPT_PAGES = [
    [
        { kind: 'text', id: 'jobapplication', label: 'omnibar_suggestedPromptsTextJobApplication', Icon: EditIcon },
        { kind: 'text', id: 'homefix', label: 'omnibar_suggestedPromptsTextHomeFix', Icon: HomeIcon },
        { kind: 'text', id: 'financialterms', label: 'omnibar_suggestedPromptsTextFinancialTerms', Icon: PaidIcon },
        { kind: 'text', id: 'fitnessplan', label: 'omnibar_suggestedPromptsTextFitnessPlan', Icon: ChartIcon },
    ],
    [
        { kind: 'text', id: 'writeemail', label: 'omnibar_suggestedPromptsTextWriteEmail', Icon: EmailIcon },
        { kind: 'text', id: 'plantrip', label: 'omnibar_suggestedPromptsTextPlanTrip', Icon: GlobeIcon },
        { kind: 'text', id: 'buyinghouse', label: 'omnibar_suggestedPromptsTextBuyingHouse', Icon: KeyLoginIcon },
        { kind: 'text', id: 'gettingfit', label: 'omnibar_suggestedPromptsTextGettingFit', Icon: LightThemeIcon },
    ],
    [
        { kind: 'text', id: 'difficultconversation', label: 'omnibar_suggestedPromptsTextDifficultConversation', Icon: ChatsIcon },
        { kind: 'text', id: 'newskill', label: 'omnibar_suggestedPromptsTextNewSkill', Icon: PuzzleIcon },
        { kind: 'text', id: 'moneyhabits', label: 'omnibar_suggestedPromptsTextMoneyHabits', Icon: CreditCardIcon },
        { kind: 'text', id: 'improvesleep', label: 'omnibar_suggestedPromptsTextImproveSleep', Icon: DarkThemeIcon },
    ],
];

/** @type {ImagePrompt[]} */
export const IMAGE_PROMPTS = [
    {
        kind: 'image',
        id: 'createcomic',
        label: 'omnibar_suggestedPromptsImageCreateComic',
        prompt: 'omnibar_suggestedPromptsImageCreateComicPrompt',
        image: './suggested-prompts/thumbnail-comic-default.jpg',
        hoverImage: './suggested-prompts/thumbnail-comic-hover.jpg',
        mode: 'send',
    },
    {
        kind: 'image',
        id: 'designspace',
        label: 'omnibar_suggestedPromptsImageDesignSpace',
        prompt: 'omnibar_suggestedPromptsImageDesignSpacePrompt',
        image: './suggested-prompts/thumbnail-space-default.jpg',
        hoverImage: './suggested-prompts/thumbnail-space-hover.jpg',
        mode: 'send',
    },
    {
        kind: 'image',
        id: 'editphoto',
        label: 'omnibar_suggestedPromptsImageEditPhoto',
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
