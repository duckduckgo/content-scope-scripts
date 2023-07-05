import { useEffect, useState } from 'react'
import { ToggleList } from './toggle-list'

/**
 * @typedef {import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
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
        return <ToggleList onClick={toggleItem} items={globalList.value} renderInfo={(item) => {
            return (
                <small className="toggle-list__small" data-count={item.exceptions.length}>
                    {item.exceptions.length} exceptions
                </small>
            )
        }}/>
    }

    return <p>{globalList.error}</p>
}

/**
 * @param {object} props
 * @param {import('monaco-editor').editor.ITextModel} props.model
 */
export function FeatureToggleListDomainExceptions (props) {
    // some local state not stored in xstate (yet)
    const [inputValue, setInputValue] = useState('')
    const list = domainExceptionsFromJsonString(props.model.getValue(), inputValue)

    /**
     * @param {string} key - a feature name, like `duckPlayer`
     */
    function toggleItem (key) {
        const parsed = JSON.parse(props.model.getValue())
        const prev = parsed.features[key].exceptions.findIndex(x => x.domain === inputValue)
        if (prev === -1) {
            parsed.features[key].exceptions.push({ domain: inputValue, reason: 'debug tools' })
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
        <div data-testid="domain-exceptions">
            <form>
                <input placeholder="enter a domain" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                <label htmlFor="">
                    Select an existing domain
                    <select name="domain-select" id="" onChange={(e) => setInputValue(e.target.value)} defaultValue="none">
                        <option disabled value="none">Select an existing domain</option>
                        {list.value.domains.map(domain => {
                            return <option key={domain} value={domain}>{domain}</option>
                        })}
                    </select>
                </label>
            </form>
            <br/>
            <h3>Domain Exceptions <small>(disabled for this domain explicity)</small></h3>
            {list.value.exceptions.length > 0 && <ToggleList onClick={toggleItem} items={list.value.exceptions}/>}
            {list.value.exceptions.length === 0 && <p>No exceptions yet for this site</p>}
            <br/>
            <h3>Global state <small>(not tied to any domain)</small></h3>
            <ToggleList onClick={toggleItem} items={list.value.global}/>
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
