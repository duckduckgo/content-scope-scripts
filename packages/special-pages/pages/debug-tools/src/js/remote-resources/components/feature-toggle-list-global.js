import { useEffect, useState } from 'react'
import { ToggleList } from './toggle-list'
import { tryCreateDomain } from '../remote-resources.machine'
import { useMachine } from '@xstate/react'
import { domainMachine } from '../domain-exceptions.machine'
import { assign } from 'xstate'

/**
 * @typedef {import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef {import('../../../../schema/__generated__/schema.types').Tab} Tab
 * @typedef {import('../../types').TabWithHostname} TabWithHostname
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 */

/**
 * @param {object} props
 * @param {import('monaco-editor').editor.ITextModel} props.model
 */
export function FeatureToggleListGlobal (props) {
    // some local state not stored in xstate (yet)
    const [globalList, setJsonGlobalList] = useState(() => itemListFromJsonString(props.model.getValue()))

    useEffect(() => {
        // this could occur from the toggles changes, or from another thing, like the revert action
        const sub = props.model.onDidChangeContent(() => {
            setJsonGlobalList(itemListFromJsonString(props.model.getValue()))
        })
        return () => sub.dispose()
    }, [props.model])

    /**
     * @param {string} key - a feature name, like `duckPlayer`
     */
    function toggleItem (key) {
        const parsed = JSON.parse(props.model.getValue())
        const prev = parsed.features[key].state
        parsed.features[key].state = prev === 'enabled' ? 'disabled' : 'enabled'
        const asString = JSON.stringify(parsed, null, 4)
        props.model.setValue(asString)
    }

    if ('value' in globalList) {
        return (
            <div data-testid="FeatureToggleListGlobal">
                <ToggleList onClick={toggleItem} items={globalList.value} renderInfo={(item) => {
                    return (
                        <small className="toggle-list__small" data-count={item.exceptions.length}>
                            {item.exceptions.length} exceptions
                        </small>
                    )
                }}/>
            </div>
        )
    }

    return <p>{globalList.error}</p>
}

/**
 * @param {object} props
 * @param {ITextModel} props.model
 * @param {TabWithHostname[]} props.tabs
 * @param {string|undefined} props.currentDomain
 * @param {(domain: string) => void} props.setCurrentDomain
 */
export function FeatureToggleListDomainExceptions2 (props) {
    // some local state not stored in xstate (yet)
    const current = props.currentDomain || ''
    const tabs = props.tabs.map(x => x.hostname)
    const uniqueTabs = Array.from(new Set(tabs)).sort()
    const list = domainExceptionsFromJsonString(props.model.getValue(), current)

    const [state, send] = useMachine(domainMachine, {
        actions: {
            pushToUrl: (context, event) => {
                props.setCurrentDomain(event.domain)
            },
            assignTabs: assign({
                domains: (context, event) => {
                    return event.domains || []
                },
                current: (context, event) => {
                    return event.current || ''
                }
            })
        },
        services: {},
        guards: {
            'has new domain in url': (ctx, event) => {
                if (ctx.current && ctx.domains.includes(current)) {
                    return false
                }
                return true
            },
            'has unique domain': (ctx, event) => {
                return ctx.current !== event.domain
            }
        },
        delays: {}
    })

    // console.log('->', state.context.domains)
    useEffect(() => {
        send({ type: 'tabs', domains: props.tabs.map(x => x.hostname), current })
    }, [current, props.tabs])

    /**
     * @param {string} key - a feature name, like `duckPlayer`
     */
    function toggleItem (key) {
        const parsed = JSON.parse(props.model.getValue())
        const prev = parsed.features[key].exceptions.findIndex(x => x.domain === current)
        if (prev === -1) {
            parsed.features[key].exceptions.push({ domain: current, reason: 'debug tools' })
        } else {
            parsed.features[key].exceptions.splice(prev, 1)
        }
        const asString = JSON.stringify(parsed, null, 4)
        props.model.setValue(asString)
    }

    if ('error' in list) {
        return <p>{list.error}</p>
    }
    return (
        <div>
            {state.matches('showing temp domain') && (
                <>
                    <p>Showing <code>{state.context.current}</code></p>
                    <button type="button" onClick={() => send({ type: '👆 edit' })}>Edit</button>
                </>
            )}
            <form>
                <label>
                Select from an open tab
                    <select name="tab-select"
                        id=""
                        onChange={(e) => send({ type: '👆 select', domain: e.target.value })}
                        value={state.matches('showing temp domain') ? 'none' : state.context.current}>
                        <option disabled value="none">Select from tabs</option>
                        {uniqueTabs.map((tab) => {
                            return <option key={tab} value={tab}>{tab}</option>
                        })}
                    </select>
                </label>
            </form>
            {state.matches('showing tab selector') && (
                <button type="button" onClick={() => send({ type: '👆 add new' })}>Enter domain manually</button>
            )}
            {(state.matches('editing temp domain') || state.matches('adding a new domain')) && (
                <form action="" onSubmit={(e) => {
                    e.preventDefault()
                    // @ts-expect-error - ts cannot see 'elements'
                    const value = e.target.elements[0].value
                    const domain = tryCreateDomain(value)
                    if (domain) {
                        send({ type: '💾 update', domain })
                    }
                }}>
                    <label>
                        <input placeholder="enter a domain" defaultValue={''} autoFocus={true}/>
                    </label>
                    <button type="submit">Update</button>
                    <button type="button" onClick={() => send({ type: 'cancel' })}>Cancel</button>
                </form>
            )}
            <div className="row">
                <h3>Current Exceptions <small>(features disabled for <code>{current}</code> explicitly)</small></h3>
                <div className="row">
                    {list.value.exceptions.length > 0 && <ToggleList onClick={toggleItem} items={list.value.exceptions} />}
                    {list.value.exceptions.length === 0 && <div><p>No exceptions yet for this site</p></div>}
                </div>
            </div>
            <div className="row">
                <h3>Add a new exception<small> (disable a feature for <code>{current}</code>)</small></h3>
                <div className="row">
                    <ToggleList onClick={toggleItem} items={list.value.global}/>
                </div>
            </div>
        </div>
    )
}

/**
 * @param {string} jsonString
 * @return {{ value: (ToggleListItem & { exceptions: any[] })[] } | { error: string }}
 */
export function itemListFromJsonString (jsonString) {
    try {
        const parsed = JSON.parse(jsonString)
        return {
            value: Object.entries(parsed.features).map(([featureName, feature]) => {
                return {
                    id: featureName,
                    title: featureName,
                    state: (feature.state === 'enabled' ? 'on' : 'off'),
                    exceptions: feature.exceptions
                }
            })
        }
    } catch (e) {
        if (!window.__playwright_01) {
            console.trace('itemListFromJsonString: ', e)
        }
    }
    return {
        error: 'Cannot use toggles because the format was invalidated (probably because of edits)'
    }
}

/**
 * @typedef {import('./toggle-list').ToggleListItem} ToggleListItem
 */

/**
 * @param {string} jsonString
 * @param {string} domain
 * @return {{ value: { exceptions: ToggleListItem[]; global: ToggleListItem[]; domains: string[] } } | { error: string }}
 */
export function domainExceptionsFromJsonString (jsonString, domain) {
    try {
        const parsed = JSON.parse(jsonString)
        const exceptions = []
        const global = []
        const domains = []
        for (const [featureName, feature] of Object.entries(parsed.features)) {
            domains.push(...feature.exceptions.map(x => x.domain))
            const exception = feature.exceptions.find(x => x.domain === domain)
            const isOn = feature.state === 'enabled' && !exception
            const entry = {
                id: featureName,
                title: featureName,
                state: isOn ? /** @type {const} */('on') : /** @type {const} */('off'),
                exception
            }
            if (exception) exceptions.push(entry)
            if (!exception) global.push(entry)
        }
        return {
            value: {
                exceptions,
                global,
                domains: Array.from(new Set(domains)).sort()
            }
        }
    } catch (e) {
        if (!window.__playwright_01) {
            console.trace('itemListFromJsonString: ', e)
        }
    }
    return {
        error: 'Cannot use toggles because the format was invalidated (probably because of edits)'
    }
}
