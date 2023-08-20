import {useEffect, useState} from 'react'
import {ToggleList} from './toggle-list'
import {RemoteResourcesContext} from "../remote-resources.page";
import {parse} from "tldts";

// @ts-expect-error - debugging;
window._parse = parse;

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
 * @param {RemoteResource} props.resource
 */
export function FeatureToggleListGlobal(props) {
    // some local state not stored in xstate (yet)
    const [state, send] = RemoteResourcesContext.useActor()
    const current = state.context.currentDomain || ''
    const [globalList, setJsonGlobalList] = useState(() => itemListFromJsonString(props.model.getValue(), current))

    useEffect(() => {
        // this could occur from the toggles changes, or from another thing, like the revert action
        const sub = props.model.onDidChangeContent(() => {
            setJsonGlobalList(itemListFromJsonString(props.model.getValue(), current))
        })
        return () => sub.dispose()
    }, [props.model, current])

    useEffect(() => {
        // this could occur from the toggles changes, or from another thing, like the revert action
        setJsonGlobalList(itemListFromJsonString(props.model.getValue(), current))
    }, [current])

    /**
     * @param {string} key - a feature name, like `duckPlayer`
     */
    function toggleItem(key) {
        const parsed = JSON.parse(props.model.getValue())
        const prev = parsed.features[key].state
        parsed.features[key].state = prev === 'enabled' ? 'disabled' : 'enabled'
        const asString = JSON.stringify(parsed, null, 4)
        props.model.setValue(asString)
    }

    /**
     * @param {string} key - a feature name, like `duckPlayer`
     * @param {string} domain - the domain to toggle
     */
    function toggleDomain (key, domain) {
        const parsed = JSON.parse(props.model.getValue())
        const prev = parsed.features[key].exceptions.findIndex(x => x.domain === domain)
        if (prev === -1) {
            parsed.features[key].exceptions.push({ domain: domain, reason: "debug tools" })
        } else {
            parsed.features[key].exceptions.splice(prev, 1)
        }
        const asString = JSON.stringify(parsed, null, 4)
        props.model.setValue(asString)
    }

    if ('value' in globalList) {
        return (
            <div data-testid="FeatureToggleListGlobal">
                <ToggleList
                    domain={current}
                    onClick={toggleItem}
                    onClickDomain={toggleDomain}
                    items={globalList.value}
                    renderInfo={(item) => {
                        return (
                            <small data-count={item.exceptions.length}>
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
 * @param {string | undefined} domain
 * @return {{ value: (ToggleListItem & { exceptions: any[] })[] } | { error: string }}
 */
export function itemListFromJsonString(jsonString, domain) {
    try {
        let etldPlus1;
        let targetDomain = domain;
        if (typeof domain === "string") {
            const temp = parse(domain);
            if (temp?.domain) etldPlus1 = temp.domain;
        }
        const parsed = JSON.parse(jsonString)
        return {
            value: Object.entries(parsed.features).map(([featureName, feature]) => {
                let domainState;
                if (etldPlus1?.length > 0) {
                    const exception = feature.exceptions.find(exception => {
                        // exact match
                        if (exception.domain === etldPlus1 || exception.domain === domain) {
                            return true;
                        }

                        // otherwise, no match
                        return false;
                    });
                    domainState = exception ? /** @type {const} */('off') : /** @type {const} */('on');
                    if (exception) {
                        targetDomain = exception.domain;
                    }
                } else {
                    domainState = /** @type {const} */('on')
                }
                if (feature.state === 'disabled') {
                    domainState = /** @type {const} */('disabled')
                }
                const next = {
                    id: featureName,
                    title: featureName,
                    globalState: feature.state === 'enabled' ? /** @type {const} */('on') : /** @type {const} */('off'),
                    exceptions: feature.exceptions,
                    domainState,
                    targetDomain,
                };

                return next;
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
