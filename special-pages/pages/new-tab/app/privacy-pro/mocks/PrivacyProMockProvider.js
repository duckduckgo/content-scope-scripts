import { useCallback, useReducer } from 'preact/hooks';
import { h } from 'preact';
import { PrivacyProContext, PrivacyProDispatchContext } from '../PrivacyProProvider.js';
import { data as privProData } from './stats.js';
import { reducer } from '../../service.hooks.js';

/**
 * @typedef {import('../../../types/new-tab.js').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').PrivacyProData} PrivacyProData
 * @typedef {import('../../../types/new-tab.js').PrivacyProConfig} PrivacyProConfig
 * @typedef {import('../../service.hooks.js').State<PrivacyProData, PrivacyProConfig>} State
 * @typedef {import('../../service.hooks.js').Events<PrivacyProData, PrivacyProConfig>} Events
 */

/**
 * A provider used in storybook-like situations: it just returns a static set of
 * data + a toggle function.
 *
 * @param {Object} props - The props object containing the data.
 * @param {import("preact").ComponentChild} [props.children] - The children elements to be rendered.
 * @param {PrivacyProConfig} [props.config]
 * @param {PrivacyProData} [props.data]
 * @param {boolean} [props.ticker] - if true, gradually increment the count of the first company, for testing
 *
 */
export function PrivacyProMockProvider({
    data = privProData.basic,
    config = { expansion: 'expanded', animation: { kind: 'auto-animate' } },
    children,
}) {
    const initial = /** @type {import('../PrivacyProProvider.js').State} */ ({
        status: 'ready',
        data,
        config,
    });
    const [state, send] = useReducer(reducer, initial);

    const toggle = useCallback(() => {
        if (state.status !== 'ready') return console.warn('was not ready');
        if (state.config?.expansion === 'expanded') {
            send({ kind: 'config', config: { ...state.config, expansion: 'collapsed' } });
        } else {
            send({ kind: 'config', config: { ...state.config, expansion: 'expanded' } });
        }
    }, [state.config?.expansion]);

    const action = (id) => console.log('Click on ', id);

    return (
        <PrivacyProContext.Provider value={{ state, toggle, action }}>
            <PrivacyProDispatchContext.Provider value={send}>{children}</PrivacyProDispatchContext.Provider>
        </PrivacyProContext.Provider>
    );
}
