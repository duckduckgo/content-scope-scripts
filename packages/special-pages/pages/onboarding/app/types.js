/**
 * @typedef {'dock'
 *   | 'import'
 *   | 'default-browser'
 *   | 'bookmarks'
 *   | 'session-restore'
 *   | 'home-shortcut'
 * } SystemValueId - Each setting that can be updated should have a unique ID listed here.
 */

/**
 * @typedef {WelcomeStep | GetStartedStep | PrivateByDefaultStep | CleanerBrowsingStep | SystemSettingsStep | CustomizeStep | SummaryStep} Step
 * @typedef {{ kind: 'info'; id: 'welcome' }} WelcomeStep
 * @typedef {{ kind: 'info'; id: 'getStarted' }} GetStartedStep
 * @typedef {{ kind: 'info'; id: 'privateByDefault' }} PrivateByDefaultStep
 * @typedef {{ kind: 'info'; id: 'cleanerBrowsing' }} CleanerBrowsingStep
 * @typedef {{ kind: 'settings'; id: 'systemSettings'; rows: SystemValueId[]; }} SystemSettingsStep
 * @typedef {{ kind: 'settings'; id: 'customize'; rows: SystemValueId[]; }} CustomizeStep
 * @typedef {{ kind: 'info'; id: 'summary' }} SummaryStep
 */

/**
 * @typedef {BooleanSystemValue} SystemValue - values sent in messages to the host
 * @typedef {{ enabled: boolean }} BooleanSystemValue
 * @typedef {'idle' | 'accepted' | 'skipped'} UIValue
 */

/**
 * @typedef {{ kind: 'idle', error?: string } |
 *   { kind: 'executing', action: GlobalEvents } |
 *   { kind: 'fatal'; action: ErrorBoundaryEvent }
 * } Status - types to represent the state of the system
 */

/**
 * @typedef {Object} GlobalState
 * @property {import("./data").StepDefinitions} stepDefinitions
 * @property {Step} step
 * @property {Step['id'][]} order
 * @property {Step['id']} activeStep
 * @property {number} activeRow
 * @property {boolean} activeStepVisible
 * @property {boolean} exiting
 * @property {Status} status
 * @property {Partial<Record<SystemValueId, SystemValue>>} values
 * @property {Record<SystemValueId, UIValue>} UIValues
 */

/**
 * @typedef {NextForRealEvent
 *   | TitleCompleteEvent
 *   | NextEvent
 *   | UpdateSystemValueEvent
 *   | ExecCompleteEvent
 *   | ExecErrorEvent
 *   | DismissEvent
 *   | DismisstoSettingsEvent
 *   | ErrorBoundaryEvent} GlobalEvents
 *  All the events that the UI can dispatch
 * @typedef {{ kind: "next" }} NextEvent
 * @typedef {{ kind: "next-for-real" }} NextForRealEvent
 * @typedef {{ kind: "update-system-value"; id: SystemValueId; payload: SystemValue; current: boolean;}} UpdateSystemValueEvent
 * @typedef {{ kind: "exec-complete"; id: SystemValueId; payload: SystemValue }} ExecCompleteEvent
 * @typedef {{ kind: "exec-error"; id: SystemValueId; message: string }} ExecErrorEvent
 * @typedef {{ kind: "dismiss" }} DismissEvent
 * @typedef {{ kind: "dismiss-to-settings" }} DismisstoSettingsEvent
 * @typedef {{ kind: "error-boundary"; error: { message: string; id: Step['id'] }}} ErrorBoundaryEvent
 * @typedef {{ kind: "title-complete"; }} TitleCompleteEvent
 *
 */

/** @type {Step['id'][]} */
export const PAGE_IDS = [
    'welcome',
    'getStarted',
    'privateByDefault',
    'cleanerBrowsing',
    'systemSettings',
    'customize',
    'summary'
]

/** @type {ImportMeta['injectName'][]} */
export const PLATFORMS = [
    'apple',
    'windows'
]

export {}
