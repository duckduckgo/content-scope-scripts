/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module ReleaseNotes Messages
 */

/**
 * Message sent from browser when release notes are updated
 */
export type UpdateMessage =
    | LoadingState
    | ReleaseNotesLoadedState
    | UpdateReadyState
    | UpdateErrorState
    | DownloadingUpdateState
    | PreparingUpdateState

/**
 * Requests, Notifications and Subscriptions from the ReleaseNotes feature
 */
export interface ReleaseNotesMessages {
    notifications: BrowserRestartNotification | ReportInitExceptionNotification | ReportPageExceptionNotification | RetryUpdateNotification
    requests: InitialSetupRequest
    subscriptions: OnUpdateSubscription
}
/**
 * Generated from @see "../messages/release-notes/browserRestart.notify.json"
 */
export interface BrowserRestartNotification {
    method: 'browserRestart'
    params: BrowserRestart
}
/**
 * Notifies browser that user has requested a restart
 */
export interface BrowserRestart {}
/**
 * Generated from @see "../messages/release-notes/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
    method: 'reportInitException'
    params: ReportInitException
}
/**
 * Notifies browser of a page initialization exception
 */
export interface ReportInitException {
    /**
     * Exception description
     */
    message: string
}
/**
 * Generated from @see "../messages/release-notes/reportPageException.notify.json"
 */
export interface ReportPageExceptionNotification {
    method: 'reportPageException'
    params: ReportPageException
}
/**
 * Notifies browser of an in-page exception
 */
export interface ReportPageException {
    /**
     * Exception description
     */
    message: string
}
/**
 * Generated from @see "../messages/release-notes/retryUpdate.notify.json"
 */
export interface RetryUpdateNotification {
    method: 'retryUpdate'
    params: RetryUpdate
}
/**
 * Notifies browser that user has requested to retry a failed update
 */
export interface RetryUpdate {}
/**
 * Generated from @see "../messages/release-notes/initialSetup.request.json"
 */
export interface InitialSetupRequest {
    method: 'initialSetup'
    result: InitialSetupResponse
}
/**
 * Response message to page setup request
 */
export interface InitialSetupResponse {
    /**
     * Browser environment
     */
    env: 'development' | 'production'
    /**
     * Browser locale
     */
    locale: string
}
/**
 * Generated from @see "../messages/release-notes/onUpdate.subscribe.json"
 */
export interface OnUpdateSubscription {
    subscriptionEvent: 'onUpdate'
    params: UpdateMessage
}
/**
 * Loading release notes
 */
export interface LoadingState {
    status: 'loading'
    /**
     * Current version of the app
     */
    currentVersion: string
    /**
     * Timestamp of last check for version updates
     */
    lastUpdate: number
}
/**
 * Release notes loaded. Browser is up-to-date
 */
export interface ReleaseNotesLoadedState {
    status: 'loaded'
    /**
     * Current version of the app
     */
    currentVersion: string
    /**
     * Latest version of the app. May be the same as currentVersion
     */
    latestVersion: string
    /**
     * Timestamp of last check for version updates
     */
    lastUpdate: number
    /**
     * Name of the current release (e.g. April 26 2024)
     */
    releaseTitle?: string
    /**
     * Array containing notes for the latest release
     */
    releaseNotes?: string[]
    /**
     * Array containing Privacy Pro notes for the latest release
     */
    releaseNotesPrivacyPro?: string[]
}
/**
 * Update downloaded and installed. Restart to update
 */
export interface UpdateReadyState {
    status: 'updateReady' | 'criticalUpdateReady'
    automaticUpdate: boolean
    /**
     * Current version of the app
     */
    currentVersion: string
    /**
     * Latest version of the app. May be the same as currentVersion
     */
    latestVersion: string
    /**
     * Timestamp of last check for version updates
     */
    lastUpdate: number
    /**
     * Name of the current release (e.g. April 26 2024)
     */
    releaseTitle?: string
    /**
     * Array containing notes for the latest release
     */
    releaseNotes?: string[]
    /**
     * Array containing Privacy Pro notes for the latest release
     */
    releaseNotesPrivacyPro?: string[]
}
/**
 * An error occurred during the update process
 */
export interface UpdateErrorState {
    status: 'updateError'
    /**
     * Current version of the app
     */
    currentVersion: string
    /**
     * Latest version of the app. May be the same as currentVersion
     */
    latestVersion: string
    /**
     * Timestamp of last check for version updates
     */
    lastUpdate: number
    /**
     * Name of the current release (e.g. April 26 2024)
     */
    releaseTitle?: string
    /**
     * Array containing notes for the latest release
     */
    releaseNotes?: string[]
    /**
     * Array containing Privacy Pro notes for the latest release
     */
    releaseNotesPrivacyPro?: string[]
}
/**
 * An update is available and being downloaded
 */
export interface DownloadingUpdateState {
    status: 'updateDownloading'
    /**
     * Current version of the app
     */
    currentVersion: string
    /**
     * Latest version of the app. May be the same as currentVersion
     */
    latestVersion: string
    /**
     * Timestamp of last check for version updates
     */
    lastUpdate: number
    /**
     * Download progress of new version as a decimal number from 0 to 1, where 1 is fully downloaded
     */
    downloadProgress: number
}
/**
 * An update has been downloaded and is being installed
 */
export interface PreparingUpdateState {
    status: 'updatePreparing'
    /**
     * Current version of the app
     */
    currentVersion: string
    /**
     * Latest version of the app. May be the same as currentVersion
     */
    latestVersion: string
    /**
     * Timestamp of last check for version updates
     */
    lastUpdate: number
}

declare module '../pages/release-notes/src/js/index.js' {
    export interface ReleaseNotesPage {
        notify: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<ReleaseNotesMessages>['notify']
        request: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<ReleaseNotesMessages>['request']
        subscribe: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<ReleaseNotesMessages>['subscribe']
    }
}
