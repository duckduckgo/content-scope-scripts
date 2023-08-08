import * as z from 'zod'
import { useRef } from 'react'

/**
 * @typedef{ import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef{ import('../../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 */

/**
 * @param {{
 *   resource: RemoteResource;
 *   save: (res: UpdateResourceParams) => void;
 *   pending: boolean;
 * }} props
 */
export function RemoteResourceUrl (props) {
    const ref = useRef(null)
    const value = (() => {
        if ('remote' in props.resource.current.source) {
            return props.resource.current.source.remote.url
        }
        if ('debugTools' in props.resource.current.source) {
            return '<debugTools>'
        }
        throw new Error('unreachable')
    })()

    function save (e) {
        e.preventDefault()
        if (!ref) return
        const formData = Object.fromEntries(new FormData(e.target))
        const schema = z.object({
            'resource-url': z.string()
        })
        const data = schema.parse(formData)
        props.save({
            id: props.resource.id,
            source: {
                remote: {
                    url: data['resource-url']
                }
            }
        })
    }

    function resetToDefault () {
        props.save({
            id: props.resource.id,
            source: {
                remote: {
                    url: props.resource.url
                }
            }
        })
    }

    const diff = value !== props.resource.url

    return <div>
        <div className="row">
            <form onSubmit={save} id="remote-resource-url">
                <fieldset className="inline-fields" disabled={props.pending}>
                    <input
                        defaultValue={value}
                        style={{
                            width: '100%',
                            fontSize: '12px'
                        }}
                        name="resource-url"
                    />
                    <button type={'submit'}>{props.pending ? 'saving....' : 'Update remote url'}</button>
                </fieldset>
            </form>
        </div>
        {diff
            ? <div className="row flex">
                <button className="button" type={'button'} onClick={resetToDefault}>{props.pending ? 'saving....' : 'Reset'}</button>
                <code className="ml-1">{props.resource.url}</code>
            </div>
            : null
        }
    </div>
}
