const TS_DIRECTIVE = /^[\s/*]*@ts-(expect-error|ignore|nocheck)(.*)/;

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
        // oxlint runs typescript/ban-ts-comment on TypeScript files only, and this repo is mostly checkJs
        'ban-ts-comment': {
            create(context) {
                return {
                    Program() {
                        for (const comment of context.sourceCode.getAllComments()) {
                            const match = TS_DIRECTIVE.exec(comment.value);
                            if (!match) continue;
                            const [, directive, description] = match;
                            if (directive === 'ignore') {
                                context.report({ node: comment, message: 'Use "@ts-expect-error" instead of "@ts-ignore"' });
                            } else if (directive === 'nocheck') {
                                context.report({ node: comment, message: 'Do not use "@ts-nocheck"' });
                            } else if (description.trim().length < 3) {
                                context.report({
                                    node: comment,
                                    message: 'Add a description of at least 3 characters after "@ts-expect-error"',
                                });
                            }
                        }
                    },
                };
            },
        },
    },
};
