import { assign, createMachine, pure, raise } from 'xstate'
import jsonpatch from 'fast-json-patch'
import * as z from 'zod'
import invariant from 'tiny-invariant'

/**
 * @typedef {import("xstate").ActorRefFrom<typeof patchesMachine>} PatchesMachineRef
 */

export const STORAGE_KEY = 'resource_patches'

export const patchesMachine = createMachine({
    id: 'patches',
    context: {
        /** @type {Record<string, string>} */
        before: {},
        /** @type {Record<string, string>} */
        after: {},
        /** @type {string | null} */
        currentId: null,
        /** @type {ResourcePatches} */
        patches: {}
    },
    type: 'parallel',
    states: {
        stored: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        PATCH_AVAILABLE: {
                            target: 'patchAvailable'
                        }
                    }
                },
                patchAvailable: {
                    on: {
                        COPY_TO_CLIPBOARD: {
                            target: 'copying'
                        }
                    }
                },
                copying: {
                    invoke: {
                        src: 'copyToClipboard',
                        id: 'copyToClipboard',
                        onDone: [
                            {
                                target: 'patchPreSuccess'
                            }
                        ],
                        onError: [
                            {
                                target: 'patchError'
                            }
                        ]
                    }
                },
                patchPreSuccess: {
                    description: 'use this to display a fake spinner',
                    after: {
                        500: [
                            {
                                target: '#patches.stored.patchSuccess',
                                actions: [],
                                meta: {}
                            },
                            {
                                internal: false
                            }
                        ]
                    }
                },
                patchError: {
                    after: {
                        1000: [
                            {
                                target: '#patches.stored.patchAvailable',
                                actions: [],
                                meta: {}
                            },
                            {
                                internal: false
                            }
                        ]
                    }
                },
                patchSuccess: {
                    after: {
                        2000: [
                            {
                                target: '#patches.stored.patchAvailable',
                                actions: [],
                                meta: {}
                            },
                            {
                                internal: false
                            }
                        ]
                    }
                }
            }
        },
        observing: {
            initial: 'idle',
            states: {
                idle: {
                    entry: ['raise-if-available'],
                    on: {
                        broadcastPreResourceUpdated: {
                            actions: {
                                type: 'assignBefore'
                            },
                            internal: true
                        },
                        broadcastPostResourceUpdated: {
                            target: 'processing',
                            actions: {
                                type: 'assignAfter'
                            }
                        },
                        broadcastResourceSelected: {
                            target: 'restorePatches',
                            actions: [
                                {
                                    type: 'assignCurrentId'
                                }
                            ]
                        }
                    }
                },
                restorePatches: {
                    invoke: {
                        src: 'restoringPatches',
                        id: 'restoringPatches',
                        onDone: [
                            {
                                target: 'idle',
                                actions: [
                                    {
                                        type: 'assignRestoredPatches',
                                        params: {}
                                    }
                                ]
                            }
                        ]
                    }
                },
                processing: {
                    invoke: {
                        src: 'create-patch',
                        id: 'create-patch',
                        onDone: [
                            {
                                target: 'idle',
                                actions: [
                                    {
                                        type: 'assignPatch',
                                        params: {}
                                    },
                                    {
                                        type: 'storePatches',
                                        params: {}
                                    }
                                ]
                            }
                        ],
                        onError: [
                            {
                                target: 'idle',
                                actions: {
                                    type: 'assignError',
                                    params: {}
                                }
                            }
                        ]
                    }
                }
            }
        }
    },
    schema: {
        events: /** @type {import('../types').RemoteResourcesBroadcastEvents | import('../types').PatchesEvents} */({})
    },
    predictableActionArguments: true,
    preserveActionOrder: true
}, {
    actions: {
        'raise-if-available': pure((ctx) => {
            if (ctx.currentId && ctx.currentId in ctx.patches) {
                return raise('PATCH_AVAILABLE')
            }
            return []
        }),
        assignRestoredPatches: assign({
            patches: (ctx, /** @type {any} */evt) => {
                const parsed = ResourcePatches.parse(evt.data)
                return parsed
            }
        }),
        assignPatch: assign({
            patches: (ctx, /** @type {any} */evt) => {
                const parsed = z.array(ops).safeParse(evt.data)
                if (parsed.success) {
                    if (ctx.currentId) {
                        return {
                            ...ctx.patches,
                            [ctx.currentId]: [{
                                kind: /** @type {const} */('json-fast-patch'),
                                resourceId: ctx.currentId,
                                createdAt: new Date().toISOString(),
                                patches: parsed.data
                            }]
                        }
                    }
                } else {
                    console.error(parsed.error)
                }
                return ctx.patches
            }
        }),
        assignBefore: assign({
            before: (ctx, evt) => {
                if (evt.type === 'broadcastPreResourceUpdated') {
                    return {
                        ...ctx.before,
                        [evt.payload.resource.id]: evt.payload.resource.current.contents
                    }
                }
                throw new Error('unreachable')
            }
        }),
        assignCurrentId: assign({
            currentId: (ctx, evt) => {
                console.log('assing?')
                invariant(evt.type === 'broadcastResourceSelected', 'incorrect evt ' + evt.type)
                return evt.payload.currentResource.id
            }
        }),
        assignAfter: assign({
            after: (ctx, evt) => {
                if (evt.type === 'broadcastPostResourceUpdated') {
                    return {
                        ...ctx.after,
                        [evt.payload.resource.id]: evt.payload.resource.current.contents
                    }
                }
                throw new Error('unreachable')
            },
            currentId: (ctx, evt) => {
                if (evt.type === 'broadcastPostResourceUpdated') {
                    return evt.payload.resource.id
                }
                throw new Error('unreachable')
            }
        }),
        showError: (_ctx, evt) => {
            console.log('TODO: handle showError', evt)
            alert('TODO: handle showError')
        },
        storePatches: (ctx) => {
            const parsed = ResourcePatches.safeParse(ctx.patches)
            if (parsed.success) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data))
            } else {
                console.warn('not storing because of validation errors', parsed.error)
            }
        }
    },
    services: {
        // eslint-disable-next-line require-await
        copyToClipboard: async (ctx) => {
            if (ctx.currentId) {
                const first = ctx.patches[ctx.currentId][0]
                invariant(Boolean(first), 'unreachable')
                const string = JSON.stringify(first.patches, null, 2)
                return navigator.clipboard.writeText(string)
            }
            return null
        },
        // eslint-disable-next-line require-await
        restoringPatches: async (ctx) => {
            const values = localStorage.getItem(STORAGE_KEY)
            const parsed = ResourcePatches.safeParse(JSON.parse(values || '{}'))
            if (parsed.success) {
                return parsed.data
            } else {
                console.warn('cannot restore values', parsed.error)
            }
            return {}
        },
        // eslint-disable-next-line require-await
        'create-patch': async (ctx) => {
            if (ctx.currentId && ctx.before && ctx.after) {
                const a = JSON.parse(ctx.before[ctx.currentId])
                const b = JSON.parse(ctx.after[ctx.currentId])
                return jsonpatch.compare(a, b)
            }
            return []
        }
    }
})

const ops = z.discriminatedUnion('op', [
    z.object({
        path: z.string(),
        op: z.literal('add'),
        value: z.any()
    }),
    z.object({
        path: z.string(),
        op: z.literal('remove')
    }),
    z.object({
        path: z.string(),
        op: z.literal('replace'),
        value: z.any()
    }),
    z.object({
        path: z.string(),
        op: z.literal('move'),
        from: z.string()
    }),
    z.object({
        path: z.string(),
        op: z.literal('copy'),
        from: z.string()
    }),
    z.object({
        path: z.string(),
        op: z.literal('test'),
        value: z.any()
    }),
    z.object({
        path: z.string(),
        op: z.literal('_get')
    })
])

export const ResourcePatches = z.record(z.array(z.discriminatedUnion('kind', [
    z.object({
        createdAt: z.string(),
        resourceId: z.string(),
        kind: z.literal('json-fast-patch'),
        patches: z.array(ops)
    })
])))

/**
 * @typedef {import("zod").infer<typeof ResourcePatches>} ResourcePatches
 * @typedef {import("zod").infer<typeof ops>} Ops
 */
