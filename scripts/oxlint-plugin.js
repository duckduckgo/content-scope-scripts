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
        // Same reason as ban-ts-comment
        'no-this-alias': {
            create(context) {
                const report = (node) => context.report({ node, message: 'Unexpected aliasing of "this" to a local variable' });
                return {
                    VariableDeclarator(node) {
                        if (node.init?.type === 'ThisExpression' && node.id.type === 'Identifier') report(node);
                    },
                    AssignmentExpression(node) {
                        if (node.right.type === 'ThisExpression' && node.left.type === 'Identifier') report(node);
                    },
                };
            },
        },
        // oxlint's promise/prefer-await-to-then skips `return promise.then()`
        'no-return-then': {
            create(context) {
                return {
                    ReturnStatement(node) {
                        const arg = node.argument;
                        if (
                            arg?.type === 'CallExpression' &&
                            arg.callee.type === 'MemberExpression' &&
                            arg.callee.property.name === 'then'
                        ) {
                            context.report({ node: arg.callee.property, message: 'Prefer await to then()' });
                        }
                    },
                };
            },
        },
    },
};
