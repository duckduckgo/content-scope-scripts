import { useCallback, useReducer } from 'preact/hooks';
import { h } from 'preact';
import { ActivityContext } from '../ActivityProvider.js';
import { activityMocks } from './activity.mocks.js';
import { reducer } from '../../service.hooks.js';

/**
 * @typedef {import('../../../types/new-tab').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../types/new-tab').ActivityData} ActivityData
 * @typedef {import('../../../types/new-tab').ActivityConfig} ActivityConfig
 * @typedef {import('../../service.hooks.js').State<ActivityData, ActivityConfig>} State
 * @typedef {import('../../service.hooks.js').Events<ActivityData, ActivityConfig>} Events
 */

/**
 * A provider used in storybook-like situations: it just returns a static set of
 * data + a toggle function.
 *
 * @param {Object} props - The props object containing the data.
 * @param {import("preact").ComponentChild} [props.children] - The children elements to be rendered.
 * @param {ActivityConfig} [props.config]
 * @param {ActivityData} [props.data]
 * @param {boolean} [props.ticker] - if true, gradually increment the count of the first company, for testing
 *
 */
export function ActivityMockProvider({
    data = activityMocks.few,
    config = { expansion: 'expanded', animation: { kind: 'auto-animate' } },
    children,
}) {
    const initial = /** @type {import('../ActivityProvider.js').State} */ ({
        status: 'ready',
        data,
        config,
    });

    /** @type {[State, import('preact/hooks').Dispatch<Events>]} */
    const [state, send] = useReducer(reducer, initial);

    const toggle = useCallback(() => {
        if (state.status !== 'ready') return console.warn('was not ready');
        if (state.config?.expansion === 'expanded') {
            send({ kind: 'config', config: { ...state.config, expansion: 'collapsed' } });
        } else {
            send({ kind: 'config', config: { ...state.config, expansion: 'expanded' } });
        }
    }, [state.config?.expansion]);

    return <ActivityContext.Provider value={{ state, toggle }}>{children}</ActivityContext.Provider>;
}
