/**
 * These types are auto-generated from schema files.
 * scripts/build-types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module Duckplayer Messages
 */

export type PrivatePlayerMode =
    | {
          enabled: unknown
      }
    | {
          disabled: unknown
      }
    | {
          alwaysAsk: unknown
      }

/**
 * Requests, Notifications and Subscriptions from the Duckplayer feature
 */
export interface DuckplayerMessages {
    notifications:
        | OpenInfoNotification
        | OpenSettingsNotification
        | ReportInitExceptionNotification
        | ReportPageExceptionNotification
        | TelemetryEventNotification
    requests: GetUserValuesRequest | InitialSetupRequest | SetUserValuesRequest
    subscriptions: OnUserValuesChangedSubscription
}
/**
 * Generated from @see "../messages/duckplayer/openInfo.notify.json"
 */
export interface OpenInfoNotification {
    method: 'openInfo'
}
/**
 * Generated from @see "../messages/duckplayer/openSettings.notify.json"
 */
export interface OpenSettingsNotification {
    method: 'openSettings'
}
/**
 * Generated from @see "../messages/duckplayer/reportInitException.notify.json"
 */
export interface ReportInitExceptionNotification {
    method: 'reportInitException'
    params: ReportInitExceptionNotify
}
export interface ReportInitExceptionNotify {
    message: string
}
/**
 * Generated from @see "../messages/duckplayer/reportPageException.notify.json"
 */
export interface ReportPageExceptionNotification {
    method: 'reportPageException'
    params: ReportPageExceptionNotify
}
export interface ReportPageExceptionNotify {
    message: string
}
/**
 * Generated from @see "../messages/duckplayer/telemetryEvent.notify.json"
 */
export interface TelemetryEventNotification {
    method: 'telemetryEvent'
    params: TelemetryEvent
}
export interface TelemetryEvent {
    attributes: Impression
}
export interface Impression {
    name: 'impression'
    value: 'landscape-layout'
}
/**
 * Generated from @see "../messages/duckplayer/getUserValues.request.json"
 */
export interface GetUserValuesRequest {
    method: 'getUserValues'
    result: UserValues
}
export interface UserValues {
    overlayInteracted: boolean
    privatePlayerMode: PrivatePlayerMode
}
/**
 * Generated from @see "../messages/duckplayer/initialSetup.request.json"
 */
export interface InitialSetupRequest {
    method: 'initialSetup'
    result: InitialSetupResponse
}
export interface InitialSetupResponse {
    userValues: UserValues
    settings: DuckPlayerPageSettings
    locale: string
    env: 'development' | 'production'
    platform: {
        name: 'macos' | 'windows' | 'android' | 'ios'
    }
    /**
     * Optional locale-specific strings
     */
    localeStrings?: string
}
export interface DuckPlayerPageSettings {
    pip: {
        state: 'enabled' | 'disabled'
    }
    autoplay?: {
        state: 'enabled' | 'disabled'
    }
    focusMode?: {
        state: 'enabled' | 'disabled'
    }
}
/**
 * Generated from @see "../messages/duckplayer/setUserValues.request.json"
 */
export interface SetUserValuesRequest {
    method: 'setUserValues'
    params: UserValues
    result: UserValues
}
/**
 * Generated from @see "../messages/duckplayer/onUserValuesChanged.subscribe.json"
 */
export interface OnUserValuesChangedSubscription {
    subscriptionEvent: 'onUserValuesChanged'
    params: UserValues
}

declare module '../pages/duckplayer/src/js/index.js' {
    export interface DuckplayerPage {
        notify: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<DuckplayerMessages>['notify']
        request: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<DuckplayerMessages>['request']
        subscribe: import('@duckduckgo/messaging/lib/shared-types').MessagingBase<DuckplayerMessages>['subscribe']
    }
}
