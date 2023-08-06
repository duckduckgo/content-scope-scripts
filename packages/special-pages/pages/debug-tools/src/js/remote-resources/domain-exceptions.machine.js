import { assign, createMachine } from 'xstate'
import { useMachine } from '@xstate/react'
import { tryCreateDomain } from './remote-resources.machine'

export const domainMachine = createMachine({
    id: 'domains',
    context: {
        /** @type {string[]} */
        domains: [],
        /** @type {string} */
        current: '',
        /** @type {string} */
        nextDefault: ''
    },
    states: {
        'current domain': {
            initial: 'idle',
            states: {
                idle: {
                    always: {
                        target: 'showing current domain',
                        cond: 'has valid domain in url'
                    },
                    on: {
                        ADD_NEW: {
                            target: 'adding new domain'
                        }
                    }
                },
                'showing current domain': {
                    on: {
                        EDIT: {
                            target: 'editing domain'
                        },
                        ADD_NEW: {
                            target: 'editing domain'
                        },
                        CLEAR: {
                            target: 'idle',
                            actions: ['clear current', 'push to URL']
                        }
                    }
                },
                'adding new domain': {
                    on: {
                        SAVE_NEW: {
                            target: 'idle',
                            actions: 'push to URL',
                            cond: 'isValidDomain'
                        },
                        CANCEL: {
                            target: 'idle'
                        }
                    }
                },
                'editing domain': {
                    entry: ['assignNextDefault'],
                    on: {
                        SAVE_NEW: {
                            target: 'idle',
                            actions: 'push to URL',
                            cond: 'isValidDomain'
                        },
                        CANCEL: {
                            target: 'showing current domain'
                        }
                    }
                }
            }
        },
        'tab selector': {
            initial: 'reading domains',
            states: {
                'reading domains': {
                    description: 'this could be empty',
                    always: [
                        {
                            target: 'single matching',
                            cond: 'tabs.length is 1 + matches current'
                        },
                        {
                            target: 'single tab',
                            cond: 'tabs.length is 1'
                        },
                        {
                            target: 'multi tabs',
                            cond: 'tabs.length > 1'
                        },
                        {
                            target: 'empty list'
                        }
                    ]
                },
                'empty list': {},
                'single matching': {},
                'single tab': {},
                'multi tabs': {}
            },
            on: {
                DOMAINS: {
                    actions: {
                        type: 'assignTabs'
                    },
                    target: '.reading domains',
                    internal: true
                },
                SELECT_TAB_DOMAIN: {
                    actions: {
                        type: 'push to URL',
                        params: {}
                    },
                    internal: true
                }
            }
        }
    },
    schema: {
        events: /** @type {import('../types').DomainExceptionEvents} */({})
    },
    type: 'parallel',
    predictableActionArguments: true,
    preserveActionOrder: true
})

/**
 * @param {object} params
 * @param {string} params.current
 * @param {string[]} params.domains
 * @param {(domain: string) => void} params.setCurrentDomain
 * @param {() => void} params.clearCurrentDomain
 *
 */
export function useDomainState (params) {
    return useMachine(domainMachine, {
        devTools: true,
        context: {
            current: params.current,
            domains: params.domains
        },
        actions: {
            'clear current': assign({
                current: ''
            }),
            assignNextDefault: assign({
                nextDefault: (ctx, evt) => {
                    if (evt.type === 'EDIT') {
                        return ctx.current
                    }
                    if (evt.type === 'ADD_NEW') {
                        return ''
                    }
                    return ''
                }
            }),
            assignTabs: assign({
                domains: (context, event) => {
                    if (event.type === 'DOMAINS') {
                        return event.domains || []
                    }
                    return []
                },
                current: (context, event) => {
                    if (event.type === 'DOMAINS') {
                        return event.current || ''
                    }
                    return ''
                }
            }),
            'push to URL': (context, event) => {
                if (event.type === 'SELECT_TAB_DOMAIN') {
                    params.setCurrentDomain(event.domain)
                }
                if (event.type === 'SAVE_NEW') {
                    params.setCurrentDomain(event.domain)
                }
                if (event.type === 'CLEAR') {
                    params.clearCurrentDomain()
                }
            }
        },
        guards: {
            'has valid domain in url': (ctx) => {
                if (ctx.current && tryCreateDomain(ctx.current)) {
                    return true
                }
                return false
            },
            isValidDomain: (ctx, event) => {
                if (event.type === 'SAVE_NEW') {
                    if (tryCreateDomain(event.domain)) {
                        console.log('is valid:')
                        return true
                    }
                }
                return false
            },
            'tabs.length is 1 + matches current': (context, event) => {
                return context.domains.length === 1 && context.domains[0] === context.current
            },
            'tabs.length is 1': (context, event) => {
                return context.domains.length === 1
            },
            'tabs.length > 1': (context, event) => {
                return context.domains.length > 1
            }
        }
    })
}
