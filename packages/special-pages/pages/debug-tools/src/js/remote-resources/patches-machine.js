import { assign, createMachine, pure, raise } from 'xstate'
import jsonpatch from 'fast-json-patch'
import * as z from 'zod'
// import { useMachine } from '@xstate/react'

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
                        PATCH_AVAILABLE: { target: 'patchAvailable' }
                    }
                },
                patchAvailable: {
                    on: {
                        COPY_TO_CLIPBOARD: { target: 'copying' }
                    }
                },
                copying: {
                    invoke: {
                        src: 'copyToClipboard',
                        onDone: { target: 'patchAvailable', actions: ['showComplete'] },
                        onError: { target: 'patchAvailable', actions: ['showError'] }
                    }
                },
                patchError: {}
            }
        },
        observing: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        preResourceUpdated: {
                            actions: 'assignBefore'
                        },
                        postResourceUpdated: {
                            actions: 'assignAfter',
                            target: 'processing'
                        }
                    }
                },
                processing: {
                    invoke: {
                        src: 'create-patch',
                        onDone: {
                            actions: ['assignPatch', 'raisePatchReady'],
                            target: 'idle'
                        },
                        onError: {
                            actions: 'assignError',
                            target: 'idle'
                        }
                    }
                }
            }
        }
    },
    schema: {
        events: /** @type {import('../types').RemoteResourcesEvents | import('../types').PatchesEvents} */({})
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
                if (evt.type === 'preResourceUpdated') {
                    return evt.payload.resource.current.contents
                }
                throw new Error('unreachable')
            }
        }),
        assignAfter: assign({
            after: (ctx, evt) => {
                if (evt.type === 'postResourceUpdated') {
                    return evt.payload.resource.current.contents
                }
                throw new Error('unreachable')
            }
        }),
        showComplete: () => {
            alert('copied!')
        }
    },
    services: {
        copyToClipboard: (ctx) => {
            const string = JSON.stringify(ctx.patch, null, 2)
            return navigator.clipboard.writeText(string)
        },
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
