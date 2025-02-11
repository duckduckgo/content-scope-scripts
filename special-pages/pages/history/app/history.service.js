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
    static CHUNK_SIZE = 150;
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
        }).withUpdater((old, next, trigger) => {
            if (trigger === 'manual') {
                // console.log('manual trigger, always accepting next:', next);
                return next;
            }
            if (eq(old.info.query, next.info.query)) {
                // console.log('Query did match', [trigger], old.info.query);
                const results = old.results.concat(next.results);
                return { info: next.info, results };
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
            limit: HistoryService.CHUNK_SIZE,
            offset: this.query.data.results.length,
        };

        this.query.triggerFetch(query);
    }

    /**
     * @param {string} url
     * @param {import('../types/history.js').OpenTarget} target
     */
    openUrl(url, target) {
        this.history.messaging.notify('open', { url, target });
    }

    /**
     * @param {(data: RangeData) => void} cb
     */
    onRanges(cb) {
        return this.ranges.onData(({ data, source }) => cb(data));
    }

    /**
     * @param {Range} range
     */
    deleteRange(range) {
        return (
            this.history.messaging
                .request('deleteRange', { range })
                // eslint-disable-next-line promise/prefer-await-to-then
                .then((resp) => {
                    if (resp.action === 'delete') {
                        if (range === 'all') {
                            this.ranges.update((_old) => {
                                return {
                                    ranges: ['all'],
                                };
                            });
                            this.query.update((_old) => {
                                /** @type {QueryData} */
                                const query = {
                                    info: {
                                        query: { term: '' },
                                        finished: true,
                                    },
                                    results: [],
                                };
                                return query;
                            });
                        } else {
                            this.ranges.update((old) => {
                                return {
                                    ...old,
                                    ranges: old.ranges.filter((x) => x !== range),
                                };
                            });
                        }
                    }
                    return resp;
                })
        );
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

    if (range === 'all') {
        query = { term: '' };
    } else if (range) {
        query = { range };
    } else if (domain) {
        query = { domain };
    } else {
        query = { term: params.get('q') || '' };
    }

    return {
        query,
        limit: HistoryService.CHUNK_SIZE,
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
