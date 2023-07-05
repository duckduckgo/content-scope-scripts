import { createMachine } from 'xstate'

export const getMachine = createMachine({
    id: 'Panel Open',
    initial: 'Initial state',
    context: /** @type {import("../types").AppMachineCtx} */({}),
    invoke: {
        src: 'nav_listener',
        id: 'history'
    },
    on: {
        nav_internal: {
            actions: ['handleInternalNav']
        }
    },
    states: {
        'Initial state': {
            invoke: {
                src: 'getFeatures',
                onDone: [
                    {
                        target: 'waiting for nav',
                        actions: 'assignFeatures'
                    }
                ],
                onError: [
                    {
                        target: 'showing error',
                        actions: 'assignError'
                    }
                ]
            }
        },
        'waiting for nav': {
            description: 'waiting for navigations',
            invoke: {
                src: 'handleInitialNav'
            },
            on: {
                'routes resolved': { target: 'routes ready' }
            }
        },
        'showing error': {
            on: {
                '👆 retry': {
                    target: 'Initial state'
                }
            }
        },
        'routes ready': {
            description: 'If we get here'
        }
    },
    schema: {
        events: /** @type {import("../types").AppEvents} */({})
    },
    predictableActionArguments: true,
    preserveActionOrder: true
})
