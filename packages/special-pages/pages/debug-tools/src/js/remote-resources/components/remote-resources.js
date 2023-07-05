import * as z from 'zod'
import { remoteResourceSchema } from '../../../../schema/__generated__/schema.parsers.mjs'
import { RemoteResourcesContext } from '../remote-resources.page'
import { RemoteResourceEditor } from './remote-resource-editor'
import useConstant from '@xstate/react/es/useConstant'
import * as monaco from 'monaco-editor'
import { useEffect } from 'react'
import { CurrentResource } from '../remote-resources.machine'

/**
 * @typedef{ import('@duckduckgo/messaging').MessagingTransport} MessagingTransport
 * @typedef{ import('../../../../schema/__generated__/schema.types').GetFeaturesResponse} GetFeaturesResponse
 * @typedef{ import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef{ import('../../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 */

export function RemoteResources () {
    const actor = RemoteResourcesContext.useActorRef()
    const { resource, resourceKey, nav } = RemoteResourcesContext.useSelector((state) => {
        const schema = z.object({
            currentResource: CurrentResource,
            resources: z.array(remoteResourceSchema),
            resourceKey: z.number()
        })

        const parsed = schema.parse(state.context)
        const match = parsed.resources.find(re => re.id === parsed.currentResource.id)

        if (!match) throw new Error('unreachable, could not access ' + parsed.currentResource.id + ' in context')

        return {
            resource: match,
            resourceKey: parsed.resourceKey,
            nav: parsed.resources.map(r => {
                return {
                    name: r.name,
                    id: r.id,
                    active: state.context.currentResource?.id === r.id
                }
            })
        }
    })

    const originalTextContent = resource.current.contents

    /**
     * Share a text model between the views
     * @type {monaco.editor.ITextModel}
     */
    const sharedTextModel = useConstant(() => {
        const model = monaco.editor.createModel(
            resource.current.contents,
            resource.current.contentType
        )

        window._test_editor_value = () => model.getValue()
        window._test_editor_set_value = (value) => {
            model.setValue(value)
        }
        return model
    })

    // ensure the monaco model stays in sync
    // in xstate we update the `resourceKey` to indicate that the UI should consider
    // the resource 'updated'
    useEffect(() => {
        sharedTextModel.setValue(originalTextContent)
    }, [resourceKey, originalTextContent, sharedTextModel])

    // subscribe to the shared model and publish events back to xstate
    useEffect(() => {
        monaco.editor.onDidChangeMarkers((uriList) => {
            const markers = monaco.editor.getModelMarkers({ resource: uriList[0] })
            const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error)
            if (errors.length > 0) {
                actor.send({ type: 'content is invalid', markers })
            } else {
                actor.send({ type: 'content is valid' })
            }
        })

        // normally this logic would live inside xstate, but I want to prevent chatty messages
        // on every key stroke
        const sub = sharedTextModel.onDidChangeContent(() => {
            if (sharedTextModel.getValue() !== originalTextContent) {
                actor.send({ type: 'content was edited' })
            } else {
                actor.send({ type: 'content was reverted' })
            }
        })
        return () => sub.dispose()
    }, [sharedTextModel, originalTextContent, actor])

    return (
        <div>
            {/* don't bother showing sub nav if there's nothing to navigate to */}
            {nav.length > 1 ? <Nav nav={nav} prefix={'/remoteResources/'} /> : null}
            <div className="main">
                <RemoteResourceEditor
                    key={resourceKey}
                    resource={resource}
                    model={sharedTextModel}
                    beforeEditor={null}
                />
            </div>
        </div>
    )
}

/**
 * @param {object} props
 * @param {{id: string; name: string; active: boolean}[]} props.nav
 * @param {string} props.prefix
 */
function Nav (props) {
    return (
        <div className="subheading">
            <ul className="subnav">
                {props.nav.map(res => {
                    return <li key={res.name}>
                        <a href={props.prefix + res.id} data-nav className="subnav__link" data-active={res.active}>{res.name}</a>
                    </li>
                })}
            </ul>
        </div>
    )
}
