import { objectKeys } from '../../../captured-globals.js';
import { ConfigParseError, isPlainObject, rejectUnknownKeys } from '../model/core.js';
import { ItemBuffer } from '../model/lists.js';
import { passesThreshold } from '../evaluate/recorders.js';
import { parseItemKeys, selectItems } from './common.js';

/**
 * @import { PredicateContext, PredicateHooks, Source } from '../model/types.js'
 * @import { Arrival, Keep, RecordedBody } from '../evaluate/recorders.js'
 */

/**
 * A `trigger` body: a recorded type, or `auto` or `breakageReport` for a run they started.
 *
 * @typedef {RecordedBody | { kind: 'auto' | 'breakageReport', where?: RecordedBody['where'], field?: RecordedBody['field'] }} TriggerBody
 */

/** The body keys naming a recorded type. */
const TYPE_KEYS = ['entryType', 'event', 'detectorEvent'];

/**
 * Parse the type a body names, and its `durationThreshold` and `target`: exactly one of `entryType` and
 * `event`, with a string.
 *
 * @param {Record<string, unknown>} raw
 * @param {string} path
 * @param {PredicateHooks} hooks
 * @returns {RecordedBody}
 */
export function parseRecordedType(raw, path, hooks) {
    const named = TYPE_KEYS.filter((key) => raw[key] !== undefined);
    const [kind, ...others] = named;
    if (kind === undefined || others.length > 0)
        throw new ConfigParseError(path, 'a body names one of `entryType`, `event` and `detectorEvent`');
    const type = raw[kind];
    if (typeof type !== 'string') throw new ConfigParseError(`${path}.${kind}`, `\`${kind}\` takes a string`);
    /** @type {RecordedBody} */
    const body = { kind: /** @type {'entryType' | 'event' | 'detectorEvent'} */ (kind), type };
    if (raw.durationThreshold !== undefined) {
        if (kind !== 'entryType' || type !== 'event') {
            throw new ConfigParseError(`${path}.durationThreshold`, '`durationThreshold` is for `event` entries only');
        }
        if (typeof raw.durationThreshold !== 'number')
            throw new ConfigParseError(`${path}.durationThreshold`, '`durationThreshold` takes a number');
        body.durationThreshold = raw.durationThreshold;
    }
    if (raw.target !== undefined) {
        if (kind !== 'event') throw new ConfigParseError(`${path}.target`, '`target` is for `event` bodies only');
        body.target = hooks.expression(raw.target, `${path}.target`, 'value');
    }
    return body;
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @returns {Keep}
 */
function parseKeep(raw, path) {
    if (raw === null) return null;
    if (raw === undefined) throw new ConfigParseError(path, '`observed` needs `keep`');
    if (!isPlainObject(raw)) throw new ConfigParseError(path, '`keep` takes an object or `null`');
    rejectUnknownKeys(raw, ['count', 'withinMs'], path);
    if (objectKeys(raw).length === 0) throw new ConfigParseError(path, '`keep` needs `count`, `withinMs` or both');
    /** @type {{ count?: number, withinMs?: number }} */
    const keep = {};
    for (const key of /** @type {const} */ (['count', 'withinMs'])) {
        const value = raw[key];
        if (value === undefined) continue;
        if (typeof value !== 'number' || !(value >= 0))
            throw new ConfigParseError(`${path}.${key}`, `\`${key}\` takes a number at or above 0`);
        keep[key] = value;
    }
    return keep;
}

/**
 * @param {unknown} raw
 * @param {string} path
 * @param {string} key
 * @returns {Record<string, unknown>}
 */
function bodyObject(raw, path, key) {
    if (!isPlainObject(raw)) throw new ConfigParseError(path, `\`${key}\` takes an object`);
    return raw;
}

/**
 * Reads the log of a recorder, over the window its `keep` sets: a selected list of the items, oldest
 * first. A type nothing recorded, or one the engine doesn't support, gives a list with no items.
 *
 * @type {Source<RecordedBody>}
 */
export const observedSource = {
    key: 'observed',
    parse(raw, path, hooks) {
        const body = bodyObject(raw, path, 'observed');
        rejectUnknownKeys(body, [...TYPE_KEYS, 'durationThreshold', 'target', 'where', 'field', 'keep'], path);
        const parsed = {
            ...parseRecordedType(body, path, hooks),
            ...parseItemKeys(body, path, hooks),
            keep: parseKeep(body.keep, `${path}.keep`),
        };
        hooks.recorded.push({ key: 'observed', body: parsed });
        return parsed;
    },
    read(bodies, ctx) {
        // `observed` takes one body
        const body = /** @type {RecordedBody} */ (bodies[0]);
        const items = body.recorder ? body.recorder.window(body).filter((item) => passesThreshold(body, item)) : [];
        return new ItemBuffer(selectItems(items, body, ctx));
    },
};

/**
 * Reads the arrival that started the run: a selected list of its items when the body names its type,
 * and of none otherwise.
 *
 * @type {Source<TriggerBody>}
 */
export const triggerSource = {
    key: 'trigger',
    parse(raw, path, hooks) {
        const body = bodyObject(raw, path, 'trigger');
        rejectUnknownKeys(body, [...TYPE_KEYS, 'auto', 'breakageReport', 'durationThreshold', 'target', 'where', 'field'], path);
        const started = ['auto', 'breakageReport'].filter((key) => body[key] !== undefined);
        /** @type {TriggerBody} */
        let parsed;
        if (started.length > 0) {
            const [kind] = started;
            if (started.length > 1 || TYPE_KEYS.some((key) => body[key] !== undefined)) {
                throw new ConfigParseError(path, 'a body names one of `entryType`, `event`, `auto` and `breakageReport`');
            }
            const value = body[/** @type {string} */ (kind)];
            if (!isPlainObject(value) || objectKeys(value).length > 0)
                throw new ConfigParseError(`${path}.${kind}`, `\`${kind}\` takes \`{}\``);
            if (body.durationThreshold !== undefined || body.target !== undefined) {
                throw new ConfigParseError(path, `\`${kind}\` takes no \`durationThreshold\` or \`target\``);
            }
            parsed = { kind: /** @type {'auto' | 'breakageReport'} */ (kind), ...parseItemKeys(body, path, hooks) };
        } else {
            const recorded = { ...parseRecordedType(body, path, hooks), ...parseItemKeys(body, path, hooks) };
            hooks.recorded.push({ key: 'trigger', body: recorded });
            parsed = recorded;
        }
        return parsed;
    },
    read(bodies, ctx) {
        // `trigger` takes one body
        const body = /** @type {TriggerBody} */ (bodies[0]);
        return new ItemBuffer(selectItems(arrivalItems(body, ctx), body, ctx));
    },
};

/**
 * The items of the run's arrival, or of each arrival batched into it, a body gives before its `where`.
 *
 * @param {TriggerBody} body
 * @param {PredicateContext} ctx
 * @returns {unknown[]}
 */
function arrivalItems(body, ctx) {
    const arrival = ctx.arrival;
    if (!arrival) return [];
    if (arrival.kind === 'batch') return arrival.parts.flatMap((part) => itemsOf(body, part));
    return itemsOf(body, arrival);
}

/**
 * The items of one arrival a body gives before its `where`: none when it names another type.
 *
 * @param {TriggerBody} body
 * @param {Arrival} arrival
 * @returns {unknown[]}
 */
function itemsOf(body, arrival) {
    if (arrival.kind !== body.kind) return [];
    if (!isRecordedBody(body)) return arrival.items;
    if (body.recorder === undefined || arrival.recorder !== body.recorder) return [];
    return arrival.items.filter((item) => passesThreshold(body, item));
}

/**
 * Whether a parsed `trigger` body names a recorded type.
 *
 * @param {TriggerBody} body
 * @returns {body is RecordedBody}
 */
export function isRecordedBody(body) {
    return body.kind === 'entryType' || body.kind === 'event' || body.kind === 'detectorEvent';
}
