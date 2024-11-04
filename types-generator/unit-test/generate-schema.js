import { generateSchema } from '../json-schema.mjs'

describe('generateSchema', () => {
    it('generates a schema structure from a file structure', () => {
        const fileList = [
            {
                relative: 'duck-player/getUserValues.request.json',
                valid: true,
                filename: 'getUserValues.request.json',
                method: 'getUserValues',
                kind: 'request',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#'
                }
            },
            {
                relative: 'duck-player/getUserValues.response.json',
                valid: true,
                filename: 'getUserValues.response.json',
                method: 'getUserValues',
                kind: 'response',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#',
                    description: 'Return types are nice!',
                    allOf: [
                        {
                            $ref: './shared/user-values.json'
                        }
                    ]
                }
            },
            {
                relative: 'duck-player/onUserValuesChanged.subscribe.json',
                valid: true,
                filename: 'onUserValuesChanged.subscribe.json',
                method: 'onUserValuesChanged',
                kind: 'subscribe',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#',
                    allOf: [
                        {
                            $ref: './shared/user-values.json'
                        }
                    ]
                }
            },
            {
                relative: 'duck-player/opened.notify.json',
                valid: true,
                filename: 'opened.notify.json',
                method: 'opened',
                kind: 'notify',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#'
                }
            },
            {
                relative: 'duck-player/pageView.notify.json',
                valid: true,
                filename: 'pageView.notify.json',
                method: 'pageView',
                kind: 'notify',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#',
                    type: 'object',
                    additionalProperties: false,
                    required: ['a'],
                    properties: {
                        a: {
                            type: 'string'
                        }
                    }
                }
            },
            {
                relative: 'duck-player/setUserValues.request.json',
                valid: true,
                filename: 'setUserValues.request.json',
                method: 'setUserValues',
                kind: 'request',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#',
                    allOf: [
                        {
                            $ref: './shared/user-values.json'
                        }
                    ]
                }
            },
            {
                relative: 'duck-player/setUserValues.response.json',
                valid: true,
                filename: 'setUserValues.response.json',
                method: 'setUserValues',
                kind: 'response',
                json: {
                    $schema: 'http://json-schema.org/draft-07/schema#',
                    allOf: [
                        {
                            $ref: './shared/user-values.json'
                        }
                    ]
                }
            }
        ]
        const expected = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            title: 'DuckPlayer_messages',
            description: 'Requests, Notifications and Subscriptions from the DuckPlayer feature',
            additionalProperties: false,
            properties: {
                notifications: {
                    oneOf: [
                        {
                            type: 'object',
                            title: 'opened_notification',
                            description: 'Generated from @see "../messages/duck-player/opened.notify.json"',
                            additionalProperties: false,
                            required: ['method'],
                            properties: {
                                method: {
                                    const: 'opened'
                                }
                            }
                        },
                        {
                            type: 'object',
                            title: 'pageView_notification',
                            description: 'Generated from @see "../messages/duck-player/pageView.notify.json"',
                            additionalProperties: false,
                            required: ['method', 'params'],
                            properties: {
                                method: {
                                    const: 'pageView'
                                },
                                params: {
                                    $ref: './duck-player/pageView.notify.json'
                                }
                            }
                        }
                    ]
                },
                requests: {
                    oneOf: [
                        {
                            type: 'object',
                            title: 'getUserValues_request',
                            description: 'Generated from @see "../messages/duck-player/getUserValues.request.json"',
                            additionalProperties: false,
                            required: ['method', 'result'],
                            properties: {
                                method: {
                                    const: 'getUserValues'
                                },
                                result: {
                                    $ref: './duck-player/getUserValues.response.json'
                                }
                            }
                        },
                        {
                            type: 'object',
                            title: 'setUserValues_request',
                            description: 'Generated from @see "../messages/duck-player/setUserValues.request.json"',
                            additionalProperties: false,
                            required: ['method', 'params', 'result'],
                            properties: {
                                method: {
                                    const: 'setUserValues'
                                },
                                params: {
                                    $ref: './duck-player/setUserValues.request.json'
                                },
                                result: {
                                    $ref: './duck-player/setUserValues.response.json'
                                }
                            }
                        }
                    ]
                },
                subscriptions: {
                    oneOf: [
                        {
                            type: 'object',
                            title: 'onUserValuesChanged_subscription',
                            description: 'Generated from @see "../messages/duck-player/onUserValuesChanged.subscribe.json"',
                            additionalProperties: false,
                            required: ['subscriptionEvent', 'params'],
                            properties: {
                                subscriptionEvent: {
                                    const: 'onUserValuesChanged'
                                },
                                params: {
                                    $ref: './duck-player/onUserValuesChanged.subscribe.json'
                                }
                            }
                        }
                    ]
                }
            },
            required: ['notifications', 'requests', 'subscriptions']
        }
        const actual = generateSchema('DuckPlayer', fileList)
        expect(actual).toEqual(/** @type {any} */ (expected))
    })
})
