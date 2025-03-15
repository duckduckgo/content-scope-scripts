import { join } from 'path';
import { promises } from 'node:fs';

/**
 * @param {object} params
 * @param {string} params.pathMatch
 * @param {RegExp} params.regex
 * @returns {import("esbuild").Plugin}
 */
export function commentPlugin({ pathMatch, regex }) {
    const PLUGIN_ID = 'comment-override';

    /** @type {import("esbuild").Plugin} */
    const plugin = {
        name: PLUGIN_ID,
        setup(build) {
            // watch every import/require and mark matches for processing
            build.onResolve({ filter: /.*/ }, (args) => {
                const path = join(args.resolveDir, args.path);
                if (!path.includes(pathMatch)) return undefined;

                // mark this file for processing
                return {
                    path: args.path,
                    namespace: PLUGIN_ID,
                    pluginData: {
                        fullPath: join(args.resolveDir, args.path + '.js'),
                    },
                };
            });

            // this will only run for files matched above
            build.onLoad({ filter: /.*/, namespace: PLUGIN_ID }, async (args) => {
                const text = await promises.readFile(args.pluginData.fullPath, 'utf8');
                return {
                    contents: convertToLegalComments(text.toString(), regex),
                    loader: 'js',
                };
            });
        },
    };
    return plugin;
}

/**
 * Detect the start of a particular comment and change the
 * lines to have the prefix `//!`
 *
 * When a line is detect
 *
 * @param {string} source
 * @param {RegExp} regex
 */
export function convertToLegalComments(source, regex) {
    const lines = [];

    let insideCommentBlock = false;

    for (const line of source.split('\n')) {
        if (insideCommentBlock) {
            if (!line.match(/^\/\//)) {
                insideCommentBlock = false;
            }
        } else {
            if (line.match(regex)) {
                insideCommentBlock = true;
            }
        }

        // chose line treatment
        if (insideCommentBlock) {
            lines.push('//!' + line.slice(2));
        } else {
            lines.push(line);
        }
    }

    return lines.join('\n');
}
