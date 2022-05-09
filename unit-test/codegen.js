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
                            password: { type: 'string' }
                        },
                        required: ['username']
                    }
                },
                required: ['success']
            }
            /**
             * @type {import('../src/messaging/codegen').Input[]}
             */
            const inputs = [
                { json: requestSchema, relative: '01.json' },
                { json: responseSchema, relative: '02.json' }
            ]
            const { types } = parse(inputs)
            console.log(types)
        })
    })
})
