/**
 * @typedef {import('../types/history.js').Range} Range
 * @typedef {import('../types/history.js').RangeId} RangeId
 * @typedef {{ranges: Range[]}} RangeData
 * @typedef {{kind: 'none'} | { kind: 'domain-search'; value: string }} MenuContinuation
 */

export class HistoryRangeService {
    data = new EventTarget();

    /**
     * @type {RangeData|null}
     */
    ranges = null;

    /**
     * @param {import("../src/index.js").HistoryPage} history
     */
    constructor(history) {
        this.history = history;
    }

    /**
     * @param {RangeData} d
     */
    accept(d) {
        this.ranges = d;
        this.data.dispatchEvent(new Event('data'));
    }

    /**
     * @returns {Promise<RangeData>}
     */
    async getInitial() {
        const rangesPromise = await this.history.messaging.request('getRanges');
        this.accept(rangesPromise);
        return rangesPromise;
    }

    /**
     * @param {(data: RangeData) => void} cb
     */
    onResults(cb) {
        const controller = new AbortController();
        this.data.addEventListener(
            'data',
            () => {
                if (this.ranges === null) throw new Error('unreachable');
                cb(this.ranges);
            },
            { signal: controller.signal },
        );
        return () => controller.abort();
    }

    /**
     * @param {(d: RangeData) => RangeData} updater
     */
    update(updater) {
        if (this.ranges === null) throw new Error('unreachable');
        this.accept(updater(this.ranges));
    }

    /**
     * @param {RangeId} range
     */
    async deleteRange(range) {
        console.log('📤 [deleteRange]: ', JSON.stringify({ range }));
        const resp = await this.history.messaging.request('deleteRange', { range });
        if (resp.action === 'delete') {
            if (range === 'all') {
                this.update((_old) => {
                    return {
                        ranges: [{ id: 'all', count: 0 }],
                    };
                });
            } else {
                this.update((old) => {
                    return {
                        ...old,
                        ranges: old.ranges.filter((x) => x.id !== range),
                    };
                });
            }
        }
        return resp;
    }
}
