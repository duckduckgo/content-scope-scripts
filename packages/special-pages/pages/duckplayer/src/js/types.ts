import { UserValues } from './messages'
import { MessagingBase } from '@duckduckgo/messaging/lib/shared-types'

export interface Messages {
  requests:
    | { method: 'setUserValues'; params: UserValues; }
    | { method: 'getUserValues'; result: UserValues; }
  subscriptions:
    | { subscriptionEvent: 'onUserValuesChanged'; params: UserValues; }
}

declare module './messages.js' {
  export interface DuckPlayerPageMessages {
    request: MessagingBase<Messages>['request']
    subscribe: MessagingBase<Messages>['subscribe']
  }
}
