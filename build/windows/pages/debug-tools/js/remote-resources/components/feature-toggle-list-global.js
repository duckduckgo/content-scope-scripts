import { useEffect, useState } from 'react'
import { ToggleList } from './toggle-list'

/**
 * @typedef {import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef {import('../../../../schema/__generated__/schema.types').Tab} Tab
 * @typedef {import('../../types').TabWithHostname} TabWithHostname
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 * @typedef {import('./toggle-list').ToggleListItem} ToggleListItem
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
