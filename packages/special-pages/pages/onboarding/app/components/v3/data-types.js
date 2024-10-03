/** @typedef {import('../../types').ORDER_V3[number]} StepsV3  */

/**
 * @typedef {object} Progress
 * @property {number} current
 * @property {number} total
 */

/**
 * @typedef {object} BeforeAfterFunctions
 * @property {() => import('./BeforeAfterProvider').BeforeAfter|null} get
 * @property {(value: import('./BeforeAfterProvider').BeforeAfter) => void} set
 * @property {() => void} toggle
 */

/**
 * @typedef {object} StepConfigParams
 * @property {ReturnType<typeof import('../../types')['useTypedTranslation']>['t']} t
 * @property {ImportMeta['platform']} platformName
 * @property {import('../../types').GlobalState} globalState
 * @property {Progress} progress
 * @property {() => void} advance
 * @property {() => void} dismiss
 * @property {(id: import('../../types').SystemValueId) => void} enableSystemValue
 * @property {BeforeAfterFunctions} beforeAfter
 */

/**
 * @typedef {object} HeadingConfig
 * @property {string|string[]} title
 * @property {string|null} [subtitle]
 * @property {boolean} speechBubble
 * @property {import('preact').ComponentChild} [children]
 */

/**
 * @typedef {object} ButtonConfig
 * @property {string} text
 * @property {import('preact').JSX.Element} [startIcon]
 * @property {import('preact').JSX.Element} [endIcon]
 * @property {() => void} handler
 */

/**
 * @typedef {object} StepConfig
 * @property {'plain'|'box'} variant
 * @property {HeadingConfig} heading
 * @property {ButtonConfig|null} [dismissButton]
 * @property {ButtonConfig|null} [acceptButton]
 * @property {import('preact').ComponentChild} [content]
 */

/**
 * @typedef {StepConfigParams & StepConfig} StepData
 */

export {}
