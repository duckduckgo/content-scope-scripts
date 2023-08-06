import { useDomainState } from '../domain-exceptions.machine'
import { useEffect } from 'react'

/**
 * Helper for syncing state with domains
 * @param {object} props
 * @param {string[]} props.domains
 * @param {string} props.current
 * @param {(domain: string) => void} props.setCurrentDomain
 * @param {() => void} props.clearCurrentDomain
 */
export function DomainForm (props) {
    const { current, domains } = props

    const [state, send] = useDomainState({
        current,
        domains,
        setCurrentDomain: props.setCurrentDomain,
        clearCurrentDomain: props.clearCurrentDomain
    })

    useEffect(() => {
        // keep tabs up to date with parent
        send({ type: 'DOMAINS', domains: props.domains, current })
    }, [current, props.domains])

    const views = {
        'no entries': null,
        'single matching current': null,
        '1 entry': <label>
            Use open tab domain:
            <button onClick={() => send({ type: 'SELECT_TAB_DOMAIN', domain: state.context.domains[0] })}>{state.context.domains[0]}</button>
        </label>,
        'more than 1 entry': (
            <label>
                Select from an open tab
                <select name="tab-select"
                    id=""
                    onChange={(e) => send({ type: 'SELECT_TAB_DOMAIN', domain: e.target.value })}
                    value={state.context.current || 'none'}>
                    <option disabled value="none">Select from tabs</option>
                    {state.context.domains.map((tab) => {
                        return <option key={tab} value={tab}>{tab}</option>
                    })}
                </select>
            </label>
        )
    }

    const len = state.context.domains.length
    let listView
    if (len === 0) listView = views['no entries']
    if (len === 1) {
        if (state.context.domains[0] === current) {
            listView = views['single matching current']
        } else {
            listView = views['1 entry']
        }
    }
    if (len > 1) listView = views['more than 1 entry']

    // show the editor when we are adding or editing
    const showingEditor = state.matches(['current domain', 'editing domain']) || state.matches(['current domain', 'adding new domain'])

    return (
        <div data-testid="DomainForm">
            <pre><code>{JSON.stringify({ value: state.value, context: state.context }, null, 2)}</code></pre>
            {state.matches(['current domain', 'idle']) && (
                <>
                    <button type="button" onClick={() => send({ type: 'ADD_NEW' })}>Add a domain</button>
                </>
            )}
            {state.matches(['current domain', 'showing current domain']) && (
                <>
                    <p data-testid="DomainForm.showing">Showing <code>{state.context.current}</code></p>
                    <button type="button" onClick={() => send({ type: 'EDIT' })}>Edit</button>
                    <button type="button" onClick={() => send({ type: 'ADD_NEW' })}>New</button>
                    <button type="button" onClick={() => send({ type: 'CLEAR' })}>Clear</button>
                </>
            )}
            {showingEditor && (
                <form action="" onSubmit={(e) => {
                    e.preventDefault()
                    const fd = new FormData(/** @type {HTMLFormElement} */(e.target))
                    const domain = /** @type {string} */(fd.get('domain'))
                    send({ type: 'SAVE_NEW', domain })
                }}>
                    <label>
                        <input placeholder="enter a domain" name="domain" defaultValue={state.context.nextDefault} autoFocus={true}/>
                    </label>
                    <button type="submit">Update</button>
                    <button type="button" onClick={() => send({ type: 'CANCEL' })}>Cancel</button>
                </form>
            )}
            <form>
                {listView}
            </form>
        </div>
    )
}
