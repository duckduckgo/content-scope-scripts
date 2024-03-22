import { UserValues } from './messages'

export interface Messages {
  requests:
    | { method: 'setUserValues'; params: UserValues; }
    | { method: 'getUserValues'; result: UserValues; }
  subscriptions:
    | { subscriptionEvent: 'onUserValuesChanged'; params: UserValues; }
}

declare module './messages.js' {
  export interface DuckPlayerPageMessages {
    request: GlobalMessagingBase<Messages>['request']
    subscribe: GlobalMessagingBase<Messages>['subscribe']
  }
}
