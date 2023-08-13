import { assign, createMachine, raise } from 'xstate'
import jsonpatch from 'fast-json-patch'
import * as z from 'zod'

/**
 * @typedef {import("xstate").ActorRefFrom<typeof patchesMachine>} PatchesMachineRef
 */

export const patchesMachine = createMachine({
    id: 'patches',
    context: {
        /** @type {string} */
        before: '',
        /** @type {string} */
        after: '',
        /** @type {unknown[]} */
        patch: []
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
                    on: {
                        broadcastPreResourceUpdated: {
                            actions: {
                                type: 'assignBefore',
                                params: {}
                            },
                            internal: true
                        },
                        broadcastPostResourceUpdated: {
                            target: 'processing',
                            actions: {
                                type: 'assignAfter',
                                params: {}
                            }
                        }
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
                                        type: 'raisePatchReady',
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
        assignPatch: assign({
            patch: (ctx, /** @type {any} */evt) => {
                const parsed = z.array(z.record(z.any())).safeParse(evt.data)
                if (parsed.success) return parsed.data
                console.error(parsed.error)
                return []
            }
        }),
        raisePatchReady: raise('PATCH_AVAILABLE'),
        assignBefore: assign({
            before: (ctx, evt) => {
                if (evt.type === 'broadcastPreResourceUpdated') {
                    return evt.payload.resource.current.contents
                }
                throw new Error('unreachable')
            }
        }),
        assignAfter: assign({
            after: (ctx, evt) => {
                if (evt.type === 'broadcastPostResourceUpdated') {
                    return evt.payload.resource.current.contents
                }
                throw new Error('unreachable')
            }
        }),
        showError: (_ctx, evt) => {
            console.log('TODO: handle showError', evt)
            alert('TODO: handle showError')
        }
    },
    services: {
        copyToClipboard: (ctx) => {
            const string = JSON.stringify(ctx.patch, null, 2)
            return navigator.clipboard.writeText(string)
        },
        // eslint-disable-next-line require-await
        'create-patch': async (ctx) => {
            if (ctx.before && ctx.after) {
                const a = JSON.parse(ctx.before)
                const b = JSON.parse(ctx.after)
                return jsonpatch.compare(a, b)
            }
            return []
        }
    }
})
