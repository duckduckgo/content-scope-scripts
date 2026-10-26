import { objectKeys } from '../../../captured-globals.js';
import { getOrCreate } from '../model/core.js';

/**
 * @typedef {import('../model/types.js').PayloadData} PayloadData
 * @typedef {import('./run.js').RunFailure} RunFailure
 */

/**
 * The detector's entry in `breakageData.webDetection`.
 *
 * @typedef {object} BreakageEntry
 * @property {string} detectorId
 * @property {true} [detected] - once `match` has held and a `breakageReportData` action has written
 * @property {PayloadData} [data]
 * @property {Record<string, RunFailure>} [errors] - by the config path of the expression the failure arose at, `parse`, or `run` for an error outside any expression
 */

/**
 * What one detector has written and the failures that ended its runs.
 *
 * @typedef {{ written: boolean, data: PayloadData, errors: Map<string, RunFailure> }} EntryRecord
 */

/**
 * Each detector's breakage entry in the frame, written by its `breakageReportData` actions and by the
 * failures that end its runs, whichever trigger ran it.
 */
export class BreakageEntries {
    /** @type {Map<string, EntryRecord>} by `groupName.detectorId` */
    #records = new Map();

    /**
     * @param {string} detectorId
     * @returns {EntryRecord}
     */
    _recordOf(detectorId) {
        return getOrCreate(this.#records, detectorId, () => ({ written: false, data: {}, errors: new Map() }));
    }

    /**
     * A `breakageReportData` write. A key takes its most recent value, and a key the write omits keeps
     * its value.
     *
     * @param {string} detectorId
     * @param {PayloadData} data
     */
    write(detectorId, data) {
        const record = this._recordOf(detectorId);
        record.written = true;
        for (const key of objectKeys(data)) record.data[key] = data[key];
    }

    /**
     * A failure that ended a run, kept as the latest at its path.
     *
     * @param {string} detectorId
     * @param {string} path - the config path of the expression the failure arose at, or `run`
     * @param {RunFailure} failure
     */
    fail(detectorId, path, failure) {
        this._recordOf(detectorId).errors.set(path, failure);
    }

    /**
     * The detector's breakage entry, or `undefined` when it has not written and no failure is recorded.
     * A detector with no `match` writes its data but is never `detected`.
     *
     * @param {string} detectorId
     * @param {boolean} done - whether the detector's `match` has held
     * @returns {BreakageEntry | undefined}
     */
    entry(detectorId, done) {
        const record = this.#records.get(detectorId);
        if (!record) return undefined;
        /** @type {BreakageEntry} */
        const entry = { detectorId };
        if (record.written && done) entry.detected = true;
        if (objectKeys(record.data).length > 0) entry.data = { ...record.data };
        if (record.errors.size > 0) {
            /** @type {Record<string, RunFailure>} */
            const errors = {};
            for (const [path, failure] of record.errors) errors[path] = failure;
            entry.errors = errors;
        }
        return entry;
    }
}
