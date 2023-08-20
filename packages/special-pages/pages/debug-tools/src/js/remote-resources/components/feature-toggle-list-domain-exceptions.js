import { RemoteResourcesContext } from '../remote-resources.page'
import { DomainForm } from './domain-form'

/**
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 */

/**
 * @param {object} props
 * @param {ITextModel} props.model
 */
export function FeatureToggleListDomainExceptions (props) {
    // xstate stuff
    const [state, send] = RemoteResourcesContext.useActor()
    const current = state.context.currentDomain || ''

    /** @type {(domain: string) => void} */
    const setCurrentDomain = (domain) => send({ type: 'set current domain', payload: domain })
    const clearCurrentDomain = () => send({ type: 'clear current domain' })

    // derived state
    const tabs = state.context.tabs.map(x => x.hostname)
    const uniqueTabs = Array.from(new Set(tabs)).sort()

    return (
        <div data-testid="domain-exceptions">
            <div className="card">
                <DomainForm
                    current={current}
                    domains={uniqueTabs}
                    setCurrentDomain={setCurrentDomain}
                    clearCurrentDomain={clearCurrentDomain}
                />
            </div>
        </div>
    )
}
