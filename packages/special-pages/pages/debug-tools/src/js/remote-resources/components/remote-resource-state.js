import * as z from 'zod'
import { DD, DT, InlineDL } from '../../components/definition-list.js'
import { MicroButton } from '../../components/micro-button'
import { URLEditor } from '../../components/url-editor'

/**
 * @typedef{ import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef{ import('../../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 */

/**
 * @param {{
 *   resource: RemoteResource;
 *   setUrl: (url: string) => void;
 *   pending: boolean;
 *   edited: boolean;
 *   showOverrideForm: () => void;
 *   hideOverrideForm: () => void;
 *   showingUrlEditor: boolean;
 *   model: ITextModel;
 * }} props
 */
export function RemoteResourceState (props) {
    function saveNewRemote (e) {
        e.preventDefault()
        const formData = Object.fromEntries(new FormData(e.target))
        const schema = z.object({
            'resource-url': z.string()
        })
        const data = schema.parse(formData)
        props.setUrl(data['resource-url'])
    }

    let hasOverride
    let updatedAt
    if ('remote' in props.resource.current.source) {
        if (props.resource.current.source.remote.url !== props.resource.url) {
            hasOverride = true
        }
        updatedAt = props.resource.current.source.remote.fetchedAt
    }
    if ('debugTools' in props.resource.current.source) {
        hasOverride = true
        updatedAt = props.resource.current.source.debugTools.modifiedAt
    }

    const formatted = date(updatedAt)

    function copy (e, v) {
        e.preventDefault()
        navigator.clipboard.writeText(v)
            // eslint-disable-next-line promise/prefer-await-to-then
            .catch(console.error)
    }

    function showOverride () {
        props.showOverrideForm()
    }

    function hideOverride () {
        props.hideOverrideForm()
    }

    function storeLocally () {
        localStorage.setItem('__unstable_store_local_' + props.resource.id, props.model.getValue())
    }

    function restoreFromLocal () {
        const item = localStorage.getItem('__unstable_store_local_' + props.resource.id)
        if (item) {
            props.model.setValue(item)
        }
    }

    return (
        <div className="row card">
            <InlineDL>
                <DT>ID:</DT>
                <DD>{props.resource.id}</DD>
                {(!hasOverride && formatted)
                    ? (
                        <>
                            <DT>Last fetched:</DT>
                            <DD>{formatted} <MicroButton className="ml-3.5" onClick={() => props.setUrl(props.resource.url)}>{props.pending ? 'Updating...' : 'Refresh 🔄'}</MicroButton></DD>
                        </>
                    )
                    : null}
            </InlineDL>
            <InlineDL>
                <DT><span className={hasOverride ? 'strikethrough' : undefined}>URL:</span></DT>
                <DD>
                    <span className={hasOverride ? 'strikethrough' : undefined}>
                        {props.resource.url}{' '}
                    </span>
                    <MicroButton className="ml-3.5" onClick={(e) => copy(e, props.resource.url)}>Copy 📄</MicroButton>
                    {(!hasOverride && !props.showingUrlEditor) && (
                        <MicroButton className="ml-3.5" onClick={showOverride}>Override ✏️</MicroButton>
                    )}
                </DD>
            </InlineDL>
            {props.showingUrlEditor && (
                <div className="row">
                    <URLEditor pending={props.pending} save={saveNewRemote} cancel={hideOverride}
                        input={({ className }) => {
                            return (
                                <input autoFocus className={className} type="text" name="resource-url" placeholder="enter a url" />
                            )
                        }}
                    />
                </div>
            )}
            <Override
                resource={props.resource}
                remove={() => props.setUrl(props.resource.url)}
                pending={props.pending}
                copy={copy}
                storeLocally={storeLocally}
                restoreLocal={restoreFromLocal}
                setUrl={props.setUrl} />
        </div>
    )
}

/**
 * @param {object} props
 * @param {RemoteResource} props.resource
 * @param {() => void} props.remove
 * @param {() => void} props.storeLocally
 * @param {() => void} props.restoreLocal
 * @param {(e: any, value: string) => void} props.copy
 * @param {boolean} props.pending
 * @param {(url: string) => void} props.setUrl
 */
function Override (props) {
    const { source } = props.resource.current

    if ('remote' in source) {
        if (source.remote.url === props.resource.url) {
            return null
        }
    }

    if ('remote' in source) {
        return (
            <>
                <InlineDL>
                    <DT>CURRENT OVERRIDE:</DT>
                    <DD>
                        {source.remote.url}
                        <MicroButton className="ml-3.5" onClick={(e) => props.copy(e, source.remote.url)}>Copy 📄</MicroButton>
                        <MicroButton className="ml-3.5" onClick={props.remove}>{props.pending ? 'removing...' : 'remove ❌'}</MicroButton>
                    </DD>
                </InlineDL>
                <InlineDL>
                    <DT>Fetched at:</DT>
                    <DD>
                        {date(source.remote.fetchedAt)}
                        <MicroButton className="ml-3.5" onClick={() => props.setUrl(source.remote.url)}>{props.pending ? 'Updating...' : 'Refresh 🔄'}</MicroButton>
                    </DD>
                </InlineDL>
            </>
        )
    }

    if ('debugTools' in source) {
        return (
            <InlineDL>
                <DT>CURRENT OVERRIDE:</DT>
                <DD>
                    &lt;Debug Tools&gt;
                </DD>
                <DT>Updated at:</DT>
                <DD>
                    {date(source.debugTools.modifiedAt)}
                    <MicroButton className="ml-3.5" onClick={props.remove}>{props.pending ? 'removing...' : 'remove ❌'}</MicroButton>
                    <MicroButton className="ml-3.5" onClick={props.storeLocally}>store locally 💿</MicroButton>
                    <MicroButton className="ml-3.5" onClick={props.restoreLocal}>restore local ↪️</MicroButton>
                </DD>
            </InlineDL>
        )
    }

    return null
}

function date (input) {
    return (new Date(input)).toLocaleString('en-US',
        {
            month: 'short',
            day: 'numeric',
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        })
}
