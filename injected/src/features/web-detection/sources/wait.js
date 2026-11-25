import { objectKeys } from '../../../captured-globals.js';
import { ConfigParseError, isPlainObject, rejectUnknownKeys } from '../model/core.js';
import { parseItemKeys } from './common.js';
import { parseRecordedType } from './recorded.js';

/**
 * @import { Source } from '../model/types.js'
 * @import { RecordedBody } from '../evaluate/recorders.js'
 */

/**
 * A `wait` body: a recorded type, or `mutation` with the options of `MutationObserver.observe()`, and
 * the longest the wait lasts.
 *
 * @typedef {RecordedBody & { timeoutMs: number | null }} WaitBody
 */

/**
 * What a run suspends on at a `wait`: its body, and its `target` as evaluated when the wait starts.
 *
 * @typedef {object} WaitRequest
 * @property {WaitBody} body
 * @property {unknown} target - the evaluated `target`, a `Failure`, or `undefined` for a body with none
 */

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {number | null}
 */
function parseTimeout(raw, path) {
    if (raw === null) return null;
    if (raw === undefined) throw new ConfigParseError(path, '`wait` needs `timeoutMs`');
    if (typeof raw !== 'number' || !(raw >= 0)) throw new ConfigParseError(path, '`timeoutMs` takes a number at or above 0, or `null`');
    return raw;
}

/**
 * Suspends the run until the next item to arrive passes `where`, and resumes it with the item, or its
 * `field`, or with `undefined` once `timeoutMs` passes. A body with no `target` waits on the recorder
 * its type registers. With a `target`, evaluated when the wait starts, it listens or observes on its own
 * while the wait is open.
 *
 * @type {Source<WaitBody>}
 */
export const waitSource = {
    key: 'wait',
    suspends: true,
    parse(raw, path, hooks) {
        if (!isPlainObject(raw)) throw new ConfigParseError(path, '`wait` takes an object');
        rejectUnknownKeys(raw, ['entryType', 'event', 'mutation', 'durationThreshold', 'target', 'where', 'field', 'timeoutMs'], path);
        /** @type {RecordedBody} */
        let typed;
        if (raw.mutation !== undefined) {
            if (raw.entryType !== undefined || raw.event !== undefined)
                throw new ConfigParseError(path, 'a body names one of `entryType`, `event` and `mutation`');
            if (!isPlainObject(raw.mutation) || objectKeys(raw.mutation).length === 0) {
                throw new ConfigParseError(`${path}.mutation`, '`mutation` takes the options of `MutationObserver.observe()`');
            }
            if (raw.target === undefined) throw new ConfigParseError(path, 'a `mutation` body needs `target`');
            if (raw.durationThreshold !== undefined)
                throw new ConfigParseError(`${path}.durationThreshold`, '`durationThreshold` is for `event` entries only');
            typed = {
                kind: 'mutation',
                type: 'mutation',
                mutation: { ...raw.mutation },
                target: hooks.expression(raw.target, `${path}.target`, 'value'),
            };
        } else {
            typed = parseRecordedType(raw, path, hooks);
        }
        /** @type {WaitBody} */
        const body = { ...typed, ...parseItemKeys(raw, path, hooks), timeoutMs: parseTimeout(raw.timeoutMs, `${path}.timeoutMs`) };
        // A body with no `target` waits on the recorder its type registers
        if (body.target === undefined) hooks.recorded.push({ key: 'wait', body });
        return body;
    },
    read(bodies, ctx) {
        // `wait` takes one body
        const body = /** @type {WaitBody} */ (bodies[0]);
        /** @type {WaitRequest} */
        const request = { body, target: body.target === undefined ? undefined : ctx.read(body.target) };
        return request;
    },
};
