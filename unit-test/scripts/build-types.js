import { createMessagingTypes } from '../../scripts/utils/json-schema.mjs'

describe('createMessagingTypes', () => {
    /**
     * a helper to avoid newlines/spaces breaking otherwise good tests
     * @param {string} a
     * @param {string} b
     */
    function compare (a, b) {
        const aLines = a.trim().split('\n').map(x => x.trim()).join('\n')
        const bLines = b.trim().split('\n').map(x => x.trim()).join('\n')
        expect(aLines).toEqual(bLines)
    }
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
        }, { featurePath: '../features/duck-player.js', className: 'DuckPlayerMessages' })
        const expected = `
/**
 * The following types enforce a schema-first workflow for messages
 */
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['notify']
  }
}
`
        compare(actual, expected)
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
        }, { featurePath: '../features/duck-player.js', className: 'DuckPlayerMessages' })
        const expected = `
/**
 * The following types enforce a schema-first workflow for messages
 */
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['request']
  }
}
`
        compare(actual, expected)
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
        }, { featurePath: '../features/duck-player.js', className: 'DuckPlayerMessages' })
        const expected = `
/**
 * The following types enforce a schema-first workflow for messages
 */
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['subscribe']
  }
}
`
        compare(actual, expected)
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
        }, { featurePath: '../features/duck-player.js', className: 'DuckPlayerMessages' })
        const expected = `
/**
 * The following types enforce a schema-first workflow for messages
 */
declare module "../features/duck-player.js" {
  export interface DuckPlayer {
    notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['notify'],
    request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['request'],
    subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<DuckPlayerMessages>['subscribe']
  }
}
`
        compare(actual, expected)
    })
})
