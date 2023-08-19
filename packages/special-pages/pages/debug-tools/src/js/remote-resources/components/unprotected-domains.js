/**
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 */

import { MicroButton } from '../../components/buttons'
import * as z from 'zod'
import { DomainForm } from './domain-form'
import { RemoteResourcesContext } from '../remote-resources.page'

/**
 * @param {object} props
 * @param {ITextModel} props.model
 */
export function UnprotectedDomains (props) {
    const parsed = unprotectedFromJsonString(props.model.getValue())

    const [state] = RemoteResourcesContext.useActor()
    const tabs = state.context.tabs.map(x => x.hostname)

    /**
     * @param {string} domain
     */
    function toggleItem (domain) {
        const parsed = JSON.parse(props.model.getValue())
        const prev = parsed.unprotectedTemporary.findIndex(x => x.domain === domain)
        if (prev === -1) {
            parsed.unprotectedTemporary.push({ domain, reason: 'debug tools' })
        } else {
            parsed.unprotectedTemporary.splice(prev, 1)
        }
        const asString = JSON.stringify(parsed, null, 4)
        props.model.setValue(asString)
    }

    if ('error' in parsed) {
        return <div className="row"><p>{parsed.error}</p></div>
    }

    const uniqueTabs = Array.from(new Set(tabs))
        .filter(x => !parsed.value.domains.includes(x))
        .sort()

    return (
        <>
            <div className="row card">
                <DomainForm
                    current={''}
                    domains={uniqueTabs}
                    setCurrentDomain={(v) => toggleItem(v)}
                    clearCurrentDomain={() => console.log('clear current')}
                />
            </div>
            <div className="row">
                <p>These sites are marked as `unprotectedTemporary` in the Privacy Config</p>
                <div className="row">
                    <ul className="list">
                        {parsed.value.unprotected.map(un => {
                            return (
                                <li key={un.domain} className="flex list__item">
                                    <MicroButton className="mr-3.5" onClick={() => toggleItem(un.domain)}>❌ Remove</MicroButton>
                                    <code>{un.domain}</code>
                                </li>
                            )
                        })}
                    </ul>
                </div>

            </div>
        </>
    )
}

const Unprotected = z.object({ domain: z.string(), reason: z.string().optional() })

/**
 * @typedef {import("zod").infer<typeof Unprotected>} Unprotected
 */

/**
 * @param {string} jsonString
 * @return {{error: string} | {value: {unprotected: Unprotected[], domains: string[]}}}
 */
export function unprotectedFromJsonString (jsonString) {
    try {
        const parsed = JSON.parse(jsonString)
        const unprotected = z.array(Unprotected).parse(parsed.unprotectedTemporary)
        return {
            value: {
                unprotected,
                domains: unprotected.map(x => x.domain)
            }
        }
    } catch (e) {
        if (!window.__playwright_01) {
            console.trace('itemListFromJsonString: ', e)
        } else {
            console.log(e)
        }
    }
    return {
        error: 'Cannot show unprotected sites as the format was invalid (probably because of manual edits)'
    }
}
