import { UserValues } from './messages'

export interface Messages {
  requests:
    | { method: 'setUserValues'; params: UserValues; }
    | { method: 'getUserValues'; result: UserValues; }
}

declare module './messages.js' {
  export interface DuckPlayerPageMessages {
    request: GlobalMessagingBase<Messages>['request']
    notify: GlobalMessagingBase<Messages>['notify']
  }
}
