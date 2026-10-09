import { promises } from 'node:fs';
import { parse } from 'acorn';

/**
 * @returns {import("esbuild").Plugin}
 */
export function commentPlugin() {
    const PLUGIN_ID = 'comment-override';

    /** @type {import("esbuild").Plugin} */
    const plugin = {
        name: PLUGIN_ID,
        setup(build) {
            build.onLoad({ filter: /.*/ }, async (args) => {
                if (!args.path.includes('node_modules')) return undefined;
                const text = await promises.readFile(args.path, 'utf8');
                return {
                    contents: convertToLegalComments(text.toString()),
                    loader: 'js',
                };
            });
        },
    };
    return plugin;
}

/**
 * Detect the start of a particular comment and change the
 * lines to have the prefix `//!` - this allows esbuild to keep it
 *
 * When a line is matched, continue to match further lines until a non-comment is seen.
 *
 * @param {string} source
 */
export function convertToLegalComments(source) {
    // Process block comments - find all block comments
    const blockComments = source.match(/\/\*[\s\S]*?\*\//g) || [];

    // Selectively replace only block comments that contain "copyright"
    let modifiedSource = source;
    for (const comment of blockComments) {
        if (/copyright/i.test(comment)) {
            // Replace only the block comments with copyright
            modifiedSource = modifiedSource.replace(comment, comment.replace(/\/\*/, '/*!'));
        }
    }

    // Process line comments
    const lines = modifiedSource.split('\n');
    const result = [];
    let inCommentBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if the line contains a block comment - this breaks any line comment sequence
        if (line.includes('/*') || line.includes('*/')) {
            inCommentBlock = false;
            result.push(line);
        }
        // Check if this line starts a line comment block with "copyright"
        else if (!inCommentBlock && /^\s*\/\/(?=.*copyright.*$)/i.test(line)) {
            // Start of a copyright comment - mark it and convert
            inCommentBlock = true;
            result.push(line.replace(/^\s*\/\//, (match) => match.replace('//', '//!')));
        }
        // Check if we're continuing a line comment block
        else if (inCommentBlock && /^\s*\/\//.test(line)) {
            // Continue the comment block - convert the prefix
            result.push(line.replace(/^\s*\/\//, (match) => match.replace('//', '//!')));
        }
        // Check if we're exiting a comment block
        else {
            // Not a comment line or doesn't match our criteria, end the block
            inCommentBlock = false;
            result.push(line);
        }
    }

    return result.join('\n');
}

/**
 * Remove every comment from bundled output except legal comments (`/*!`, `//!`, `@license`, `@preserve`)
 * and `#`/`@` directives such as `//# sourceMappingURL`.
 *
 * A comment on its own line is removed with its line. Elsewhere it is replaced so that neighbouring
 * tokens stay separated and a multi-line comment still ends the line for automatic semicolon insertion.
 *
 * @param {string} source - a script (not a module)
 * @returns {string}
 */
export function stripComments(source) {
    /** @type {{ isBlock: boolean, text: string, start: number, end: number }[]} */
    const comments = [];
    parse(source, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        onComment: (isBlock, text, start, end) => {
            if (!isLegalComment(text)) comments.push({ isBlock, text, start, end });
        },
    });

    let output = '';
    let cursor = 0;
    for (const { isBlock, text, start, end } of comments) {
        let from = start;
        while (from > cursor && isHorizontalSpace(source[from - 1])) from--;
        let to = end;
        while (to < source.length && isHorizontalSpace(source[to])) to++;

        output += source.slice(cursor, from);
        const atLineStart = isAtLineStart(output);
        const atLineEnd = to === source.length || source[to] === '\n' || source[to] === '\r';

        if (atLineStart && atLineEnd) {
            // Own line: drop the indentation and the line break too
            output = output.slice(0, output.length - trailingHorizontalSpaceLength(output));
            cursor = source.startsWith('\r\n', to) ? to + 2 : Math.min(to + 1, source.length);
        } else if (atLineStart) {
            // Leading comment: keep the indentation
            output += source.slice(from, start);
            cursor = to;
        } else if (atLineEnd) {
            // Trailing comment: drop the whitespace before it
            cursor = to;
        } else if (isBlock && /[\n\r\u2028\u2029]/.test(text)) {
            output += '\n';
            cursor = to;
        } else {
            const needsSeparator = !isTokenBoundary(output[output.length - 1]) && !isTokenBoundary(source[to]);
            output += needsSeparator ? ' ' : '';
            cursor = to;
        }
    }
    return output + source.slice(cursor);
}

/**
 * @param {string} text
 */
function trailingHorizontalSpaceLength(text) {
    let i = text.length;
    while (i > 0 && isHorizontalSpace(text[i - 1])) i--;
    return text.length - i;
}

/**
 * True when only horizontal whitespace follows the last line break.
 * Scans backwards from the end, so the cost does not grow with the length of `text`.
 *
 * @param {string} text
 */
function isAtLineStart(text) {
    const i = text.length - trailingHorizontalSpaceLength(text);
    return i === 0 || text[i - 1] === '\n';
}

/**
 * Characters that can't merge with a neighbouring token, so no space is needed next to them.
 *
 * @param {string | undefined} char
 */
function isTokenBoundary(char) {
    return char === undefined || /[\s(){}[\],;]/.test(char);
}

/**
 * Matches esbuild's definition of a legal comment, plus `#`/`@` directives.
 *
 * @param {string} text - comment text without its delimiters
 */
function isLegalComment(text) {
    return /^[!#@]/.test(text) || text.includes('@license') || text.includes('@preserve');
}

/**
 * @param {string} char
 */
function isHorizontalSpace(char) {
    return char === ' ' || char === '\t';
}
