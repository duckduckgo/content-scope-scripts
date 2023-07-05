import { assign, createMachine, pure, raise } from 'xstate'
import { remoteResourceSchema } from '../../../schema/__generated__/schema.parsers.mjs'
import * as z from 'zod'
import { DebugToolsMessages } from '../DebugToolsMessages.mjs'

/** @type {Record<string, EditorKind[]>} */
const editorKindsMapping = {
    'privacy-configuration': ['toggles', 'inline', 'diff'],
    default: ['inline', 'diff']
}

const _remoteResourcesMachine = createMachine({
    id: 'remote resources machine',
    initial: 'loading resource',
    context: /** @type {import("../types").RemoteResourcesCtx} */({}),
    states: {
        'loading resource': {
            description: 'this will try to read from the incoming data',
            invoke: {
                src: 'loadResources',
                onDone: [
                    {
                        target: 'showing editor',
                        actions: ['assignResources', 'assignCurrentResource', 'assignEditorKind', 'raiseUpdated']
                    }
                ],
                onError: [
                    {
                        target: 'invalid resource',
                        actions: ['assignError']
                    }
                ]
            }
        },
        'showing editor': {
            id: 'showing editor',
            type: 'parallel',
            invoke: {
                src: 'nav-listener'
            },
            on: {
                nav_resource: {
                    actions: ['assignCurrentResource', 'assignEditorKind']
                },
                nav_other: {
                    actions: ['assignCurrentResource', 'assignEditorKind']
                }
            },
            states: {
                urlEditor: {
                    initial: 'closed',
                    states: {
                        closed: {},
                        open: {}
                    },
                    on: {
                        'show url editor': { target: '.open' },
                        'hide url editor': { target: '.closed' }
                    }
                },
                errors: {
                    initial: 'none',
                    states: {
                        none: {},
                        some: {}
                    },
                    on: {
                        error: {
                            target: '.some'
                        },
                        clearErrors: {
                            target: '.none'
                        }
                    }
                },
                contentErrors: {
                    initial: 'none',
                    states: { none: {}, some: {} },
                    on: {
                        'content is invalid': {
                            target: '.some',
                            actions: ['assignContentMarkers']
                        },
                        'content is valid': {
                            target: '.none',
                            actions: ['removeContentMarkers']
                        }
                    }
                },
                editing: {
                    initial: 'editor has original content',
                    on: {
                        'set editor kind': {
                            actions: ['pushToRoute']
                        },
                        'save new remote': {
                            target: '.saving new remote'
                        }
                    },
                    states: {
                        'editor has original content': {
                            on: {
                                'content was edited': {
                                    target: 'editor has edited content'
                                }
                            }
                        },
                        'editor has edited content': {
                            on: {
                                'save edited': [{
                                    cond: 'editor has valid content',
                                    target: 'saving edited'
                                }],
                                'content was reverted': {
                                    target: 'editor has original content'
                                }
                            }
                        },
                        'saving new remote': {
                            invoke: {
                                src: 'saveNewRemote',
                                onDone: [
                                    {
                                        target: 'editor has original content',
                                        actions: [
                                            'updateCurrentResource',
                                            'clearErrors',
                                            'raiseUpdated'
                                        ]
                                    }
                                ],
                                onError: [
                                    {
                                        target: 'editor has edited content',
                                        actions: ['serviceError']
                                    }
                                ]
                            }
                        },
                        'saving edited': {
                            description: 'save a resource with content from the editor',
                            invoke: {
                                src: 'saveEdited',
                                onDone: [
                                    {
                                        target: 'editor has original content',
                                        actions: [
                                            'updateCurrentResource',
                                            'clearErrors',
                                            'raiseUpdated'
                                        ]
                                    }
                                ],
                                onError: [
                                    {
                                        target: 'editor has edited content',
                                        actions: ['serviceError']
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        'invalid resource': {}
    },
    schema: {
        events: /** @type {import("../types").RemoteResourcesEvents} */({})
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    strict: true
})

export const remoteResourcesMachine = _remoteResourcesMachine.withConfig({
    services: {
        'nav-listener': (ctx) => (send) => {
            const sub = ctx.parent.subscribe((evt) => {
                if (evt.event.type === 'nav_internal') {
                    send({ type: 'nav_resource' })
                }
            })
            return () => {
                sub.unsubscribe()
            }
        },
        // eslint-disable-next-line require-await
        loadResources: async (ctx) => {
            const parsed = z.object({ messages: z.instanceof(DebugToolsMessages) }).parse(ctx)
            return (await parsed.messages.getFeatures()).features.remoteResources.resources
        },
        // eslint-disable-next-line require-await
        saveNewRemote: async (ctx, evt) => {
            if (evt.type === 'save new remote') {
                const response = await minDuration(ctx.messages.updateResource(evt.payload))
                return response
            }
            throw new Error('not supported')
        },
        saveEdited: async (ctx, evt) => {
            if (evt.type === 'save edited') {
                const response = await minDuration(ctx.messages.updateResource(evt.payload))
                return response
            }
            throw new Error('not supported')
        }
    },
    actions: {
        assignContentMarkers: assign({
            contentMarkers: (ctx, evt) => {
                if (evt.type === 'content is invalid') {
                    return evt.markers
                }
                return []
            }
        }),
        removeContentMarkers: assign({
            contentMarkers: () => []
        }),
        assignResources: assign({
            resources: (ctx, evt) => {
                const resources = z.array(remoteResourceSchema).parse(/** @type {any} */(evt).data)
                return resources
            }
        }),
        assignCurrentResource: assign({
            currentResource: (ctx) => {
                // otherwise select the first
                const resources = z.array(remoteResourceSchema).parse(ctx.resources)
                const parentState = ctx.parent?.state?.context
                const id = parentState.params?.id
                const match = resources.find(x => x.id === id)
                const matchingId = match ? match.id : resources[0].id

                if (!matchingId) throw new Error('unreachable - must have valid resource ID by this point')

                // matching, or default
                const kinds = editorKindsMapping[matchingId] || editorKindsMapping.default

                return {
                    id: matchingId,
                    editorKinds: kinds
                }
            }
        }),
        assignEditorKind: assign({
            editorKind: (ctx) => {
                const parentState = ctx.parent?.state?.context
                const search = parentState.search
                const parsed = EditorKind.safeParse(search?.get('editorKind'))
                if (parsed.success) {
                    if (ctx.currentResource?.editorKinds.includes(parsed.data)) {
                        console.log('setting from URL')
                        return parsed.data
                    }
                }
                {
                    const parsed = EditorKind.safeParse(ctx.currentResource?.editorKinds[0])
                    console.log('setting from from supported editor kind')
                    if (parsed.success) {
                        return parsed.data
                    }
                }
                return 'inline' // default
            }
        }),
        updateCurrentResource: assign({
            resources: (ctx, evt) => {
                // verify incoming payload
                const incomingResourceUpdate = remoteResourceSchema.parse(/** @type {any} */(evt).data)

                // ensure our local resources are in good condition
                const existingResources = z.array(remoteResourceSchema).parse(ctx.resources)

                // access the ID of the currently selected resource
                const current = CurrentResource.parse(ctx.currentResource)

                // now return a new list, replacing an ID match with the updated content
                return existingResources.map(res => {
                    if (current.id === res.id) {
                        return incomingResourceUpdate
                    } else {
                        return res
                    }
                })
            }
        }),
        raiseUpdated: pure(() => {
            return [
                assign({
                    resourceKey: (ctx) => ((ctx).resourceKey ?? 0) + 1
                }),
                // on any successful save, put the UI back into a 'clean state'
                raise({ type: 'content was reverted' }),
                raise({ type: 'hide url editor' })
            ]
        }),
        pushToRoute: (ctx, evt) => {
            const search = z.string().parse(ctx.parent.state?.context?.history?.location?.search)
            const next = new URLSearchParams(search)
            if (evt.type === 'set editor kind' && ctx.currentResource) {
                next.set('editorKind', evt.payload) // setting the editor kind
                const pathname = '/remoteResources/' + ctx.currentResource.id
                ctx.parent.state.context.history.push({
                    pathname,
                    search: next.toString()
                })
            } else {
                console.warn('could not react to pushToRoute - missing')
            }
        },
        serviceError: pure((ctx, evt) => {
            const schema = z.string()
            const parsed = schema.parse((/** @type {any} */(evt)).data?.message)
            return [
                assign({ error: () => parsed }),
                raise({ type: 'error' })
            ]
        }),
        clearErrors: pure(() => {
            return [
                assign({ error: () => null }),
                raise({ type: 'clearErrors' })
            ]
        })
    },
    guards: {
        'editor has valid content': (ctx) => {
            if (ctx.contentMarkers && ctx.contentMarkers?.length > 0) return false
            return true
        }
    }
})

/**
 * @template {Promise<any>} T
 * @param {T} cb
 * @param {number} minTime
 * @return {Promise<T>}
 */
async function minDuration (cb, minTime = 500) {
    const [result] = await Promise.allSettled([cb, new Promise(resolve => setTimeout(resolve, minTime))])
    if (result.status === 'fulfilled') return result.value
    if (result.status === 'rejected') throw new Error(result.reason)
    throw new Error('unreachable')
}

export const EditorKind = z.enum(['inline', 'diff', 'toggles'])
export const CurrentResource = z.object({ id: z.string(), editorKinds: z.array(EditorKind) })
/** @typedef {import("zod").infer<typeof EditorKind>} EditorKind */
/** @typedef {import("zod").infer<typeof CurrentResource>} CurrentResource */
