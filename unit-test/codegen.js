import { parse } from '../src/messaging/codegen.js'

describe('code generation', () => {
    describe('for a message', () => {
        fit('should generate types + message implementation', () => {
            const requestSchema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                $id: '#/definitions/GetAutofillDataRequest',
                title: 'Request Object',
                type: 'object',
                meta: {
                    name: 'getAutofillData',
                    type: 'request'
                },
                properties: {
                    mainType: { $ref: '#/definitions/Other' }
                },
                required: ['mainType'],
                definitions: {
                    Other: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        }
                    }
                }
            }
            const responseSchema = {
                $schema: 'http://json-schema.org/draft-07/schema#',
                $id: '#/definitions/GetAutofillDataResponse',
                title: 'Response Object',
                type: 'object',
                meta: {
                    name: 'getAutofillData',
                    type: 'response'
                },
                properties: {
                    success: {
                        $id: '#/definitions/AutofillData',
                        type: 'object',
                        properties: {
                            username: { type: 'string' },
                            password: { type: 'string' },
                            other: { $ref: '#/definitions/Other' }
                        },
                        required: ['username']
                    }
                },
                required: ['success'],
                definitions: {
                    Other: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', enum: ['01', '02'] }
                        }
                    }
                }
            }
            /**
             * @type {import('../src/messaging/codegen').Input[]}
             */
            const inputs = [
                // @ts-ignore
                { json: requestSchema, relative: '01.json' },
                // @ts-ignore
                { json: responseSchema, relative: '02.json' }
            ]
            const { types } = parse(inputs)
            const expected = `// Do not edit, this was created by \`scripts/schema.js\`
/**
 * @link {import("./01.json")}
 * @typedef GetAutofillDataRequest Request Object
 * @property {GetAutofillDataRequestOther} mainType
 */
/**
 * @link {import("./01.json")}
 * @typedef GetAutofillDataRequestOther
 * @property {string} [name]
 */
/**
 * @link {import("./02.json")}
 * @typedef GetAutofillDataResponse Response Object
 * @property {AutofillData} success
 */
/**
 * @link {import("./02.json")}
 * @typedef GetAutofillDataResponseOther
 * @property {"01" | "02"} [id]
 */
/**
 * @link {import("./02.json")}
 * @typedef AutofillData
 * @property {string} username
 * @property {string} [password]
 * @property {Other} [other]
 */
`
            expect(types).toBe(expected)
        })
    })
})
