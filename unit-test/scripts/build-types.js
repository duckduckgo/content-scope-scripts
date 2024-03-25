import { createMessagingTypes } from '../../scripts/utils/json-schema.mjs'

describe('createMessagingTypes', () => {
    it('works with single notification', () => {
        const actual = createMessagingTypes({
            topLevelType: 'DuckPlayerMessages',
            schema: {
                properties: {
                    notifications: {
                        oneOf: [
                            { a: 'b' }
                        ]
                    }
                }
            }
        }, { featurePath: '../features/duck-player.js' })
        const expected = `
/**
 * The following types 
 */ 
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['notify']
  }
}
`
        expect(actual.trim()).toEqual(expected.trim())
    })
    it('works with single request', () => {
        const actual = createMessagingTypes({
            topLevelType: 'DuckPlayerMessages',
            schema: {
                properties: {
                    requests: {
                        oneOf: [
                            { a: 'b' }
                        ]
                    }
                }
            }
        }, { featurePath: '../features/duck-player.js' })
        const expected = `
/**
 * The following types 
 */ 
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['request']
  }
}
`
        expect(actual.trim()).toEqual(expected.trim())
    })
    it('works with single subscription', () => {
        const actual = createMessagingTypes({
            topLevelType: 'DuckPlayerMessages',
            schema: {
                properties: {
                    subscriptions: {
                        oneOf: [
                            { a: 'b' }
                        ]
                    }
                }
            }
        }, { featurePath: '../features/duck-player.js' })
        const expected = `
/**
 * The following types 
 */ 
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['subscribe']
  }
}
`
        expect(actual.trim()).toEqual(expected.trim())
    })
    it('works with multiple types ', () => {
        const actual = createMessagingTypes({
            topLevelType: 'DuckPlayerMessages',
            schema: {
                properties: {
                    subscriptions: {
                        oneOf: [
                            { a: 'b' }
                        ]
                    },
                    requests: {
                        oneOf: [
                            { a: 'b' }
                        ]
                    },
                    notifications: {
                        oneOf: [
                            { a: 'b' }
                        ]
                    }
                }
            }
        }, { featurePath: '../features/duck-player.js' })
        const expected = `
/**
 * The following types 
 */ 
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['subscribe']
  }
}
`
        expect(actual.trim()).toEqual(expected.trim())
    })
})
