import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js'
import { useCallback, useEffect, useReducer } from 'preact/hooks'
import { h } from 'preact'
import { PrivacyStatsContext, PrivacyStatsDispatchContext, reducer } from '../PrivacyStatsProvider.js'
import { stats } from './stats.js'

/**
 * A provider used in storybook-like situations: it just returns a static set of
 * data + a toggle function.
 *
 * @param {Object} props - The props object containing the data.
 * @param {import("preact").ComponentChild} [props.children] - The children elements to be rendered.
 * @param {import('../../../../../types/new-tab.js').StatsConfig} [props.config]
 * @param {import('../../../../../types/new-tab.js').PrivacyStatsData} [props.data]
 * @param {boolean} [props.ticker] - if true, gradually increment the count of the first company, for testing
 *
 */
export function PrivacyStatsMockProvider ({ data = stats.few, config = { expansion: 'expanded' }, ticker = false, children }) {
    const { isReducedMotion } = useEnv()
    const [state, send] = useReducer(reducer, {
        status: /** @type {const} */('ready'),
        data,
        config
    })

    useEffect(() => {
        if (!ticker) return
        if (state.status === 'ready') {
            const next = {
                totalCount: state.data.totalCount + 1,
                trackerCompanies: state.data.trackerCompanies.map((company, index) => {
                    if (index === 0) return { ...company, count: company.count + 1 }
                    return company
                })
            }
            const time = setTimeout(() => {
                send({ kind: 'data', data: next })
            }, 1000)
            return () => clearTimeout(time)
        }
        return () => {
        }
    }, [state.data?.totalCount, ticker])

    const providerData = /** @type {any} */(state)
    const toggle = useCallback(() => {
        if (state.config?.expansion === 'expanded') {
            send({ kind: 'config', config: { expansion: 'collapsed' }, animate: !isReducedMotion })
        } else {
            send({ kind: 'config', config: { expansion: 'expanded' }, animate: !isReducedMotion })
        }
    }, [state.config?.expansion, isReducedMotion])

    return (
        <PrivacyStatsContext.Provider value={{ state: providerData, toggle }}>
            <PrivacyStatsDispatchContext.Provider value={send}>
                {children}
            </PrivacyStatsDispatchContext.Provider>
        </PrivacyStatsContext.Provider>
    )
}
