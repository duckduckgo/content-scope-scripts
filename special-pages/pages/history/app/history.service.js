import { Service } from '../../new-tab/app/service.js';

/**
 * @typedef {import('../types/history.js').Range} Range
 * @typedef {import("../types/history.js").HistoryQueryInfo} HistoryQueryInfo
 * @typedef {import("../types/history.js").QueryKind} QueryKind
 * @typedef {{info: HistoryQueryInfo, results: import('../types/history.js').HistoryItem[]}} QueryData
 * @typedef {{ranges: Range[]}} RangeData
 * @typedef {{query: QueryData; ranges: RangeData}} ServiceData
 */

export class HistoryService {
    /**
     * @param {import("../src/index.js").HistoryPage} history
     */
    constructor(history) {
        this.history = history;

        /** @type {Service<QueryData>} */
        this.query = new Service({
            initial: (/** @type {import('../types/history.js').HistoryQuery} */ params) => {
                return this.history.query(params).then((resp) => {
                    return { info: resp.info, results: resp.value };
                });
            },
        }).withUpdater((old, next) => {
            if (eq(old.info.query, next.info.query)) {
                const results = old.results.concat(next.results);
                console.log('next length', results.length);
                return { info: next.info, results: old.results.concat(next.results) };
            } else {
                console.log('saving new data', next);
            }
            return next;
        });

        /** @type {Service<RangeData>} */
        this.ranges = new Service({
            initial: () => {
                return this.history.messaging.request('getRanges');
            },
        });
    }

    /**
     * @param {import('../types/history.js').HistoryQuery} initQuery
     * @returns {Promise<ServiceData>}
     */
    async getInitial(initQuery) {
        const queryPromise = this.query.fetchInitial(initQuery);
        const rangesPromise = this.ranges.fetchInitial();
        const [query, ranges] = await Promise.all([queryPromise, rangesPromise]);
        return { query, ranges };
    }

    /**
     * @param {(data: QueryData) => void} cb
     */
    onResults(cb) {
        return this.query.onData(({ data, source }) => cb(data));
    }

    /**
     * @param {import('../types/history.js').HistoryQuery} query
     */
    trigger(query) {
        this.query.triggerFetch(query);
    }

    /**
     *
     */
    requestMore() {
        if (!this.query.data) return console.warn('unreachable?');
        if (this.query.data.info.finished) return console.warn('refusing to fetch more');
        const lastquery = this.query.data.info.query;

        /** @type {import('../types/history.js').HistoryQuery} */
        const query = {
            query: lastquery,
            limit: 150,
            offset: this.query.data.results.length,
        };

        this.query.triggerFetch(query);
        // console.log('next query', query);
    }
}

/**
 * @param {URLSearchParams} params
 * @return {import('../types/history.js').HistoryQuery}
 */
export function paramsToQuery(params) {
    /** @type {import('../types/history.js').HistoryQuery['query'] | undefined} */
    let query;
    const range = toRange(params.get('range'));
    const domain = params.get('domain');

    if (range) {
        query = { range };
    } else if (domain) {
        query = { domain };
    } else {
        query = { term: params.get('q') || '' };
    }

    return {
        query,
        limit: 150,
        offset: 0,
    };
}

/**
 * @param {null|undefined|string} input
 * @return {import('../types/history.js').Range|null}
 */
export function toRange(input) {
    if (typeof input !== 'string') return null;
    const valid = [
        'all',
        'today',
        'yesterday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
        'recentlyOpened',
        'older',
    ];
    return valid.includes(input) ? /** @type {import('../types/history.js').Range} */ (input) : null;
}

/**
 * @param {QueryKind} q1
 * @param {QueryKind} q2
 * @return {boolean}
 */
function eq(q1, q2) {
    return JSON.stringify(q1) === JSON.stringify(q2);
}
