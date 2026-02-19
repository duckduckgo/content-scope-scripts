/**
 * @typedef {import('../../types').ORDER_V4[number]} StepsV4
 */

/**
 * @typedef {object} Progress
 * @property {number} current - Current step position within total number of steps
 * @property {number} total - Total number of steps
 */

/** @typedef {object} BubbleConfig
 * @property {import('preact').ComponentChild} content
 * @property {{background?: import('preact').ComponentChild, foreground?: import('preact').ComponentChild}} [illustration]
 * @property {'bottom-left' | 'right'} [tail]
 */

/**
 * @typedef {object} StepConfig
 * @property {import('preact').ComponentChild} [content] - Content rendered outside bubbles (e.g., welcome step logo + title)
 * @property {BubbleConfig} [topBubble] - Top speech bubble config
 * @property {BubbleConfig} [bottomBubble] - Bottom speech bubble config (optional)
 * @property {boolean} [showProgress] - Whether to show the progress indicator in the top bubble
 * @property {'narrow' | 'wide'} [bubbleWidth] - Bubble width mode (default: 'wide'). Only getStarted uses 'narrow'.
 * @property {boolean} [introAnimation] - Whether the top bubble has an intro animation
 * @property {string} [bounceKey] - Key that triggers a bounce animation when it changes. Steps that cycle through rows should include the active row.
 */

/**
 * @typedef {object} StepConfigParams
 * @property {ReturnType<typeof import('../../types')['useTypedTranslation']>['t']} t
 * @property {ImportMeta['platform']} platformName - Current platform
 * @property {import('../../types').GlobalState} globalState - Application state
 * @property {Progress} progress - Step progress
 * @property {() => void} advance - Function that advances to the next step
 * @property {() => void} dismiss - Function that dismisses onboarding completely
 * @property {(id: import('../../types').SystemValueId) => void} enableSystemValue - Function that switches a system setting to ON
 */

/**
 * @typedef {StepConfigParams & StepConfig} StepData
 */

export {};
