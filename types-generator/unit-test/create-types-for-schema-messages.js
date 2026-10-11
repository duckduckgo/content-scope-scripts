import { createTypesForSchemaMessages } from '../build-types.mjs';

describe('createTypesForSchemaMessages', () => {
    it('compiles a minimal schema through json-schema-to-typescript', async () => {
        const schema = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            title: 'Example_messages',
            additionalProperties: false,
            properties: {
                enabled: {
                    type: 'boolean',
                },
                label: {
                    type: 'string',
                },
            },
            required: ['enabled'],
        };

        const result = await createTypesForSchemaMessages('Example', schema, '/tmp');

        expect(result).toContain('export interface ExampleMessages');
        expect(result).toContain('enabled: boolean');
        expect(result).toContain('label?: string');
        expect(result).toContain('**DO NOT** edit this file directly');
    });
});
