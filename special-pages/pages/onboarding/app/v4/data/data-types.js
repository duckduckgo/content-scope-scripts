/**
 * @typedef {import('../../types').ORDER_V4[number]} StepsV4
 */

/**
 * @typedef {object} Progress
 * @property {number} current - Current step position within total number of steps
 * @property {number} total - Total number of steps
 */

/**
 * @typedef {object} V4StepConfig
 * @property {import('preact').ComponentChild} [content] - Content rendered outside bubbles (e.g., welcome step logo + title, or illustration below bubble)
 * @property {import('preact').ComponentChild} [topBubble] - Content rendered inside the top speech bubble
 * @property {import('preact').ComponentChild} [bottomBubble] - Content rendered inside the bottom speech bubble (optional)
 * @property {boolean} [showProgress] - Whether to show the progress indicator in the top bubble
 * @property {'bottom-left'} [topBubbleTail] - Direction of the speech bubble tail on the top bubble
 * @property {{background?: import('preact').ComponentChild, foreground?: import('preact').ComponentChild}} [illustration] - Layered illustration around bottom bubble (background behind, foreground in front), or after top bubble when no bottom bubble
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
 * @typedef {StepConfigParams & V4StepConfig} StepData
 */

export {};
