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
 * @property {'bottom-left' | 'right'} [tail]
 */

/**
 * @typedef {object} StepConfig
 * @property {import('preact').ComponentChild} [content] - Content rendered outside bubbles (e.g., welcome step logo + title)
 * @property {BubbleConfig} [topBubble] - Top speech bubble config
 * @property {BubbleConfig} [bottomBubble] - Bottom speech bubble config (optional)
 * @property {{background?: import('preact').ComponentChild, foreground?: import('preact').ComponentChild}} [illustration] - Layered illustration behind/in front of the bottom bubble
 * @property {boolean} [showProgress] - Whether to show the progress indicator in the top bubble
 * @property {'narrow' | 'wide'} [bubbleWidth] - Bubble width mode (default: 'wide'). Only getStarted uses 'narrow'.
 * @property {string} [bounceKey] - Key that triggers a bounce animation when it changes. Steps that cycle through rows should include the active row.
 */

/**
 * @typedef {object} StepConfigParams
 * @property {ReturnType<typeof import('../../types')['useTypedTranslation']>['t']} t
 * @property {ImportMeta['platform']} platformName - Current platform
 * @property {import('../../types').GlobalState} globalState - Application state
 * @property {Progress} progress - Step progress
 * @property {() => void} advance - Function that advances to the next step (immediate, no exit animation)
 * @property {() => void} enqueueNext - Function that triggers exit animation, then advances
 * @property {() => void} dismiss - Function that dismisses onboarding completely
 * @property {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} updateSystemValue - Dispatches a system value update
 * @property {boolean} isShortViewport - True when viewport height is below 550px
 */

/**
 * @typedef {StepConfigParams & StepConfig} StepData
 */

export {};
