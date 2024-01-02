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
 * @typedef {WelcomeStep | WeCanHelpStep | PrivateByDefaultStep | CleanerBrowsingStep | SystemSettingsStep | CustomizeStep | SummaryStep} Step
 * @typedef {{ kind: 'info'; id: 'welcome' }} WelcomeStep
 * @typedef {{ kind: 'info'; id: 'we_can_help' }} WeCanHelpStep
 * @typedef {{ kind: 'info'; id: 'private_by_default' }} PrivateByDefaultStep
 * @typedef {{ kind: 'info'; id: 'cleaner_browsing' }} CleanerBrowsingStep
 * @typedef {{ kind: 'settings'; id: 'system_settings'; rows: SystemValueId[]; active: number }} SystemSettingsStep
 * @typedef {{ kind: 'settings'; id: 'customize'; rows: SystemValueId[]; active: number }} CustomizeStep
 * @typedef {{ kind: 'info'; id: 'summary' }} SummaryStep
 */

/**
 * @typedef {BooleanSystemValue | StringSystemValue} SystemValue - values sent in messages to the host
 * @typedef {{ enabled: boolean }} BooleanSystemValue
 * @typedef {{ enabled: boolean; value: string }} StringSystemValue
 */

/**
 * @typedef {{ kind: 'idle', error?: string } |
 *   { kind: 'executing', action: GlobalEvents } |
 *   { kind: 'final'; target: 'none' | 'settings' } |
 *   { kind: 'fatal'; action: ErrorBoundaryEvent }
 * } Status - types to represent the state of the system
 */

/**
 * @typedef {Object} GlobalState
 * @property {Step} step
 * @property {Step['id'][]} order
 * @property {Step['id']} activePage
 * @property {Status} status
 * @property {Record<string, SystemValue>} values
 */

/**
 * @typedef {NextEvent | UpdateSystemValueEvent | ExecCompleteEvent | ExecErrorEvent | DismissEvent | DismisstoSettingsEvent | ErrorBoundaryEvent} GlobalEvents
 *  All the events that the UI can dispatch
 * @typedef {{ kind: "next" }} NextEvent
 * @typedef {{ kind: "update-system-value"; id: SystemValueId; payload: SystemValue;}} UpdateSystemValueEvent
 * @typedef {{ kind: "exec-complete"; id: SystemValueId; payload: SystemValue }} ExecCompleteEvent
 * @typedef {{ kind: "exec-error"; id: SystemValueId; message: string }} ExecErrorEvent
 * @typedef {{ kind: "dismiss" }} DismissEvent
 * @typedef {{ kind: "dismiss-to-settings" }} DismisstoSettingsEvent
 * @typedef {{ kind: "error-boundary"; error: { message: string; page: Step['id'] }}} ErrorBoundaryEvent
 *
 */

/**
 * @typedef {HOME_BUTTON_POSITION[number]} HomeButtonPosition
 */
export const HOME_BUTTON_POSITION = /** @type {const} */(['hidden', 'left', 'right'])
export const PAGE_IDS = /** @type {Step['id'][]} */([
    'welcome',
    'we_can_help',
    'private_by_default',
    'cleaner_browsing',
    'system_settings',
    'customize',
    'summary'
])

export {}
