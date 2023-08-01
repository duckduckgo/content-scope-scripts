import { createMachine } from 'xstate'

export const domainMachine = createMachine({
    id: 'New Machine',
    initial: 'Initial state',
    context: {
        /** @type {string[]} */
        domains: [],
        /** @type {string} */
        current: ''
    },
    on: {
        tabs: { actions: 'assignTabs', target: 'Initial state' },
        '👆 select': {
            target: 'pushing URL update'
        }
    },
    states: {
        'Initial state': {
            always: [
                {
                    target: 'showing temp domain',
                    cond: 'has new domain in url'
                },
                {
                    target: 'showing tab selector'
                }
            ]
        },
        'showing temp domain': {
            on: {
                '👆 edit': {
                    target: 'editing temp domain'
                }
            }
        },
        'showing tab selector': {
            on: {
                '👆 add new': {
                    target: 'adding a new domain'
                }
            }
        },
        'editing temp domain': {
            on: {
                cancel: {
                    target: 'showing temp domain'
                },
                '💾 update': [{
                    target: 'pushing URL update',
                    cond: 'has unique domain'
                }]
            }
        },
        'adding a new domain': {
            on: {
                cancel: {
                    target: 'showing tab selector'
                },
                '💾 update': [{
                    target: 'pushing URL update',
                    cond: 'has unique domain'
                }]
            }
        },
        'pushing URL update': {
            entry: {
                type: 'pushToUrl',
                params: {}
            }
        }
    },
    predictableActionArguments: true,
    preserveActionOrder: true
})
