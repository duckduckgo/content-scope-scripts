import { OVERSCAN_AMOUNT } from './constants.js';
import { HistoryRangeService } from './history.range.service.js';

/**
 * @import {ActionResponse} from "../types/history.js"
 * @typedef {import('../types/history.js').Range} Range
 * @typedef {import('../types/history.js').HistoryQuery} HistoryQuery
 * @typedef {import("../types/history.js").HistoryQueryInfo} HistoryQueryInfo
 * @typedef {import("../types/history.js").QueryKind} QueryKind
 * @typedef {import('./history.range.service.js').RangeData} RangeData
 * @typedef {{info: HistoryQueryInfo; lastQueryParams: HistoryQuery|null; results: import('../types/history.js').HistoryItem[]}} QueryData
 * @typedef {{query: QueryData; ranges: RangeData}} InitialServiceData
 * @typedef {{kind: 'none'} | { kind: 'domain-search'; value: string }} MenuContinuation
 */

export class HistoryService {
    static CHUNK_SIZE = 150;
    static QUERY_EVENT = 'query';
    static QUERY_MORE_EVENT = 'query-more';
    /**
     * @return {QueryData}
     */
    static defaultData() {
        return {
            lastQueryParams: null,
            info: {
                query: { term: '' },
                finished: true,
            },
            results: [],
        };
    }

    /**
     * @type {QueryData}
     */
    data = HistoryService.defaultData();

    internal = new EventTarget();
    dataReadinessSignal = new EventTarget();

    /** @type {HistoryQuery|null} */
    ongoing = null;
    index = 0;

    /**
     * @param {import("../src/index.js").HistoryPage} history
     */
    constructor(history) {
        this.history = history;
        this.range = new HistoryRangeService(this.history);

        /**
         * Conduct a query
         */
        this.internal.addEventListener(HistoryService.QUERY_EVENT, (/** @type {CustomEvent<HistoryQuery>} */ evt) => {
            const { detail } = evt;
            this.index++;

            // store a local index, we can check it when the promise resolves
            const index = this.index;

            // reject duplicates
            if (eq(detail, this.ongoing)) return console.log('ignoring duplicate query');
            this.ongoing = JSON.parse(JSON.stringify(detail));

            this.queryFetcher(detail)
                .then((next) => {
                    const old = this.data;
                    if (old === null) throw new Error('unreachable - typescript this.query must always be there?');

                    /**
                     * First, reject overlapping promises
                     */
                    const resolvedPromiseIsStale = this.index !== index;
                    if (resolvedPromiseIsStale) return console.log('❌ rejected stale result');

                    /**
                     * concatenate results if this was a 'fetch more' request, or overwrite
                     */
                    let valueToPublish;
                    if (eq(old.info.query, next.info.query) && next.lastQueryParams?.offset > 0) {
                        const results = old.results.concat(next.results);
                        valueToPublish = { info: next.info, results, lastQueryParams: next.lastQueryParams };
                    } else {
                        valueToPublish = next;
                    }

                    this.accept(valueToPublish);
                })
                .catch((e) => {
                    console.error(e, detail);
                });
        });

        /**
         * Allow consumers to request 'more' - we'll ignore when the list is 'finished',
         * but otherwise will just increment the offset by the current length.
         */
        this.internal.addEventListener(HistoryService.QUERY_MORE_EVENT, (/** @type {CustomEvent<{end: number}>} */ evt) => {
            // console.log('🦻 [query-more]', evt.detail, this.query?.info);
            if (!this.data) return;
            /**
             * 'end' is the index of the last seen element. We use that + the result set & OVERSCAN_AMOUNT
             * whether to decide to fetch more data.
             *
             * Example:
             *  - if !finished (meaning the backend has more data)
             *  - and 'end' was 146 (meaning the 146th element was scrolled into view)
             *  - and memory.length was 150 (meaning we've got 150 items in memory)
             *  - and OVERSCAN_AMOUNT = 5
             *  - that means we WOULD fetch more, because memory.length - end = 4, which is less than OVERSCAN_AMOUNT
             *  - but if 'end' was 140, we would NOT fetch. because memory.length - end = 10 which is not less than OVERSCAN_AMOUNT
             *
             */
            if (this.data.info.finished) return;
            const { end } = evt.detail;

            const memory = this.data.results;
            if (memory.length - end < OVERSCAN_AMOUNT) {
                const lastquery = this.data.info.query;
                /** @type {HistoryQuery} */
                const query = {
                    query: lastquery,
                    limit: HistoryService.CHUNK_SIZE,
                    offset: this.data.results.length,
                };
                this.internal.dispatchEvent(new CustomEvent(HistoryService.QUERY_EVENT, { detail: query }));
            }
        });
    }

    /**
     * To 'accept' data is to store a local reference to it and treat it as 'latest'
     * We also want to broadcast the fact that new data can be read.
     * @param {QueryData} data
     */
    accept(data) {
        this.data = data;
        this.ongoing = null;
        this.dataReadinessSignal.dispatchEvent(new Event('data'));
    }

    /**
     * The single place for the query to be made
     * @param {HistoryQuery} query
     */
    queryFetcher(query) {
        console.log('🦻 [query]', query.query, 'offset:', query.offset, 'limit:', query.limit);
        // eslint-disable-next-line promise/prefer-await-to-then
        return this.history.messaging.request('query', query).then((resp) => {
            return { info: resp.info, results: resp.value, lastQueryParams: query };
        });
    }

    /**
     * @param {HistoryQuery} initQuery
     * @returns {Promise<InitialServiceData>}
     */
    async getInitial(initQuery) {
        const queryPromise = this.queryFetcher(initQuery);
        const rangesPromise = this.range.getInitial();
        const [query, ranges] = await Promise.all([queryPromise, rangesPromise]);
        this.accept(query);
        return { query, ranges };
    }

    /**
     * Allow consumers to be notified when data has changed
     * @param {(data: QueryData) => void} cb
     */
    onResults(cb) {
        const controller = new AbortController();
        this.dataReadinessSignal.addEventListener(
            'data',
            () => {
                if (this.data === null) throw new Error('unreachable');
                cb(this.data);
            },
            { signal: controller.signal },
        );
        return () => controller.abort();
    }

    /**
     * @param {(data: RangeData) => void} cb
     */
    onRanges(cb) {
        return this.range.onResults(cb);
    }

    /**
     * @param {HistoryQuery} query
     */
    trigger(query) {
        this.internal.dispatchEvent(new CustomEvent(HistoryService.QUERY_EVENT, { detail: query }));
    }

    /**
     * @param {number} end - the index of the last seen element
     */
    requestMore(end) {
        this.internal.dispatchEvent(new CustomEvent(HistoryService.QUERY_MORE_EVENT, { detail: { end } }));
    }

    /**
     * @param {string} url
     * @param {import('../types/history.js').OpenTarget} target
     */
    openUrl(url, target) {
        this.history.messaging.notify('open', { url, target });
    }

    /**
     * @param {string[]} ids
     * @param {number[]} indexes
     * @return {Promise<{kind: 'none'} | { kind: 'domain-search'; value: string }>}
     */
    async entriesMenu(ids, indexes) {
        console.log('📤 [entries_menu]: ', JSON.stringify({ ids }));
        const response = await this.history.messaging.request('entries_menu', { ids });
        if (response.action === 'none') {
            return { kind: 'none' };
        }
        if (response.action === 'delete') {
            this._postdelete(indexes);
            return { kind: 'none' };
        }
        if (response.action === 'domain-search' && ids.length === 1 && indexes.length === 1) {
            const target = this.data?.results[indexes[0]];
            const targetValue = target?.etldPlusOne || target?.domain;
            if (targetValue) {
                return { kind: 'domain-search', value: targetValue };
            } else {
                console.warn('missing target domain from current dataset?');
                return { kind: 'none' };
            }
        }
        return { kind: 'none' };
    }

    /**
     * @param {number[]} indexes
     */
    async entriesDelete(indexes) {
        const ids = this._collectIds(indexes);
        console.log('📤 [entries_delete]: ', JSON.stringify({ ids }));
        const response = await this.history.messaging.request('entries_delete', { ids });
        if (response.action === 'none') return;
        if (response.action !== 'delete') return;
        this._postdelete(indexes);
    }

    /**
     * @param {number[]} indexes
     * @return {string[]}
     */
    _collectIds(indexes) {
        const ids = [];
        for (let i = 0; i < indexes.length; i++) {
            const current = this.data?.results[indexes[i]];
            if (!current) throw new Error('unreachable');
            ids.push(current.id);
        }
        return ids;
    }

    /**
     * @param {(d: QueryData) => QueryData} updater
     */
    update(updater) {
        if (this.data === null) throw new Error('unreachable');
        this.accept(updater(this.data));
    }

    /**
     * @param {number[]} indexes
     */
    _postdelete(indexes) {
        // if we get here, the entries were removed
        this.update((old) => deleteByIndexes(old, indexes));
    }

    /**
     * @param {string} dateRelativeDay
     */
    async menuTitle(dateRelativeDay) {
        const response = await this.history.messaging.request('title_menu', { dateRelativeDay });
        if (response.action === 'none') return;
        this.update((old) => deleteByDay(old, dateRelativeDay));
    }

    reset() {
        this.update(() => {
            /** @type {QueryData} */
            const query = {
                lastQueryParams: null,
                info: {
                    query: { term: '' },
                    finished: true,
                },
                results: [],
            };
            return query;
        });
    }

    /**
     * @param {Range} range
     * @return {Promise<{kind: 'none'} | {kind: "range-deleted"}>}
     */
    async deleteRange(range) {
        const resp = await this.range.deleteRange(range);
        if (resp.action === 'delete' && range === 'all') {
            this.reset();
        }
        if (resp.action === 'delete') {
            return { kind: 'range-deleted' };
        }
        return { kind: 'none' };
    }

    /**
     * @param {string} term
     */
    async deleteTerm(term) {
        console.log('📤 [deleteTerm]: ', JSON.stringify({ term }));
        const resp = await this.history.messaging.request('deleteTerm', { term });
        if (resp.action === 'delete') {
            this.reset();
        }
        return resp;
    }
}

/**
 * @param {QueryData} old
 * @param {number[]} indexes
 * @return {QueryData}
 */
function deleteByIndexes(old, indexes) {
    const inverted = indexes.sort((a, b) => b - a);
    const removed = [];
    const next = old.results.slice();

    // remove items in reverse that that splice works multiple times
    for (let i = 0; i < inverted.length; i++) {
        removed.push(next.splice(inverted[i], 1));
    }

    /** @type {QueryData} */
    const nextStats = { ...old, results: next };
    return nextStats;
}

/**
 * @param {QueryData} old
 * @param {string} dateRelativeDay
 * @return {QueryData}
 */
function deleteByDay(old, dateRelativeDay) {
    // find the first item
    // todo: this can be optimized by passing the index in the call
    const start = old.results.findIndex((x) => x.dateRelativeDay === dateRelativeDay);
    if (start > -1) {
        // now find the last item matching, starting with the first
        let end = start;
        for (let i = start; i < old.results.length; i++) {
            if (old.results[i]?.dateRelativeDay === dateRelativeDay) continue;
            end = i;
            break;
        }
        const next = old.results.slice();
        const removed = next.splice(start, end - start);
        console.log('did remove items:', removed);
        return {
            ...old,
            results: next,
        };
    }
    return old;
}

/**
 * @param {URLSearchParams} params
 * @return {HistoryQuery}
 */
export function paramsToQuery(params) {
    /** @type {HistoryQuery['query'] | undefined} */
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
 * @param {Record<string, any>|null|undefined} q1
 * @param {Record<string, any>|null|undefined} q2
 * @return {boolean}
 */
function eq(q1, q2) {
    if (!q1 || !q2) return false;
    return JSON.stringify(q1) === JSON.stringify(q2);
}
