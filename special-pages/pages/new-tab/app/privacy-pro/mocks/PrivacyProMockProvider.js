import { useCallback, useEffect, useReducer } from 'preact/hooks';
import { h } from 'preact';
import { PrivacyContext, PrivacyDispatchContext } from '../PrivacyProProvider.js';
import { stats } from './stats.js';
import { reducer } from '../../service.hooks.js';

/**
 * @typedef {import('../../../types/new-tab.js').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').PrivacyData} PrivacyData
 * @typedef {import('../../../types/new-tab.js').StatsConfig} StatsConfig
 * @typedef {import('../../service.hooks.js').State<PrivacyData, StatsConfig>} State
 * @typedef {import('../../service.hooks.js').Events<PrivacyData, StatsConfig>} Events
 */

/**
 * A provider used in storybook-like situations: it just returns a static set of
 * data + a toggle function.
 *
 * @param {Object} props - The props object containing the data.
 * @param {import("preact").ComponentChild} [props.children] - The children elements to be rendered.
 * @param {StatsConfig} [props.config]
 * @param {PrivacyData} [props.data]
 * @param {boolean} [props.ticker] - if true, gradually increment the count of the first company, for testing
 *
 */
export function PrivacyProMockProvider({
    data = stats.few,
    config = { expansion: 'expanded', animation: { kind: 'auto-animate' } },
    ticker = false,
    children,
}) {
    const initial = /** @type {import('../PrivacyProProvider.js').State} */ ({
        status: 'ready',
        data,
        config,
    });

    /** @type {[State, import('preact/hooks').Dispatch<Events>]} */
    const [state, send] = useReducer(reducer, initial);

    useEffect(() => {
        if (!ticker) return;
        if (state.status === 'ready') {
            const next = {
                totalCount: state.data.totalCount + 1,
                trackerCompanies: state.data.trackerCompanies.map((company, index) => {
                    if (index === 0) return { ...company, count: company.count + 1 };
                    return company;
                }),
            };
            const time = setTimeout(() => {
                send({ kind: 'data', data: next });
            }, 1000);
            return () => clearTimeout(time);
        }
        return () => {};
    }, [state.data?.totalCount, ticker]);

    const toggle = useCallback(() => {
        if (state.status !== 'ready') return console.warn('was not ready');
        if (state.config?.expansion === 'expanded') {
            send({ kind: 'config', config: { ...state.config, expansion: 'collapsed' } });
        } else {
            send({ kind: 'config', config: { ...state.config, expansion: 'expanded' } });
        }
    }, [state.config?.expansion]);

    return (
        <PrivacyContext.Provider value={{ state, toggle }}>
            <PrivacyDispatchContext.Provider value={send}>{children}</PrivacyDispatchContext.Provider>
        </PrivacyContext.Provider>
    );
}
