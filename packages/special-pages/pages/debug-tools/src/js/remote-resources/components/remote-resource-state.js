import * as z from 'zod'

/**
 * @typedef{ import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef{ import('../../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
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

    function onKeyUp (e) {
        if (e.code === 'Escape') {
            props.hideOverrideForm()
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
                <URLEditor pending={props.pending} save={saveNewRemote} cancel={hideOverride} onKeyup={onKeyUp} />
            )}
            <Override resource={props.resource} remove={() => props.setUrl(props.resource.url)} pending={props.pending} copy={copy} setUrl={props.setUrl} />
        </div>
    )
}

/**
 * @param {object} props
 * @param {RemoteResource} props.resource
 * @param {() => void} props.remove
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
                </DD>
            </InlineDL>
        )
    }

    return null
}

/**
 * @param {object} props
 * @param {(evt: any) => void} props.save
 * @param {(evt: any) => void} props.onKeyup
 * @param {boolean} props.pending
 * @param {(evt: any) => void} props.cancel
 */
function URLEditor (props) {
    return (
        <form className="row font-mono text-xs" onSubmit={props.save} onKeyUp={props.onKeyup}>
            <label className="inline-form">
                <span className="inline-form__label">NEW: </span>
                <div className="inline-form__control">
                    <input autoFocus className="inline-form__input" type="text" name="resource-url" placeholder="enter a url" />
                    <button className="inline-form__button" type="submit">{props.pending ? 'Saving...' : 'Save'}</button>
                    <button className="inline-form__button" type="button" onClick={props.cancel}>Cancel</button>
                </div>
            </label>
        </form>
    )
}

function InlineDL (props) {
    const { children, ...rest } = props
    return <dl className="inline-dl text-xs font-mono" {...rest}>{children}</dl>
}

function DT (props) {
    const { children, ...rest } = props
    return <dt className="inline-dl__dt" {...rest}>{children}</dt>
}

function DD (props) {
    const { children, ...rest } = props
    return <dd className="inline-dl__dd" {...rest}>{children}</dd>
}

function MicroButton (props) {
    const { children, className, ...rest } = props
    return (
        <button
            type="button"
            className={['button'].concat(className || '').join(' ')}
            data-variant="micro"
            {...rest}>
            {children}
        </button>
    )
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
