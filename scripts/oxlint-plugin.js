export default {
    meta: { name: 'ddg' },
    rules: {
        'no-private-methods': {
            create(context) {
                return {
                    MethodDefinition(node) {
                        if (node.key.type === 'PrivateIdentifier') {
                            context.report({ node, message: 'Private methods are currently unsupported in older WebKit and ESR Firefox' });
                        }
                    },
                };
            },
        },
    },
};
