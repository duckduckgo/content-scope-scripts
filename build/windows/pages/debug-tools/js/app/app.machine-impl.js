import { assign, pure, raise } from 'xstate'
import { getFeaturesResponseSchema } from '../../../schema/__generated__/schema.parsers.mjs'
import * as z from 'zod'
import { baseMachine } from './components/app'

export const appMachine = baseMachine
    .withConfig({
        services: {
            getFeatures: (ctx) => {
                return ctx.messages.getFeatures()
            },
            nav_listener: (ctx) => (send) => {
                const history = ctx.history
                const handler = (e) => {
                    if (!(e.target instanceof HTMLAnchorElement)) return
                    if (e.target.tagName === 'A' && e.target.dataset.nav) {
                        e.preventDefault()
                        const next = e.target.pathname + e.target.hash
                        const curr = history.location.pathname + history.location.hash
                        if (next !== curr) history.push(next)
                    }
                }

                document.addEventListener('click', handler)

                const parsed = z.object({ routes: z.record(z.any()) }).parse(ctx)

                const unsubscribe = ctx.history.listen((l) => {
                    const match = matchAll(parsed.routes, l.location)
                    if (match) {
                        const [key, params] = match
                        send({ type: 'nav_internal', match: key, params, search: l.location.search })
                    } else {
                        send({ type: 'nav_internal', match: '**', params: null, search: l.location.search })
                    }
                })

                return () => {
                    unsubscribe()
                    document.removeEventListener('click', handler)
                }
            },
            // eslint-disable-next-line require-await
            handleInitialNav: (ctx) => (send) => {
                const parsed = z.object({ routes: z.record(z.any()) }).parse(ctx)
                const match = matchAll(parsed.routes, ctx.history.location)
                if (match) {
                    const [key, params] = match
                    send({ type: 'nav_internal', match: key, params, search: ctx.history.location.search })
                    send({ type: 'routes resolved' })
                } else {
                    send({ type: 'nav_internal', match: '/remoteResources/**', params: null, search: ctx.history.location.search })
                    send({ type: 'routes resolved' })
                }
            }
        },
        actions: {
            handleInternalNav: assign({
                params: (ctx, evt) => {
                    if (evt.type === 'nav_internal') {
                        return evt.params
                    }
                    return null
                },
                match: (ctx, evt) => {
                    if (evt.type === 'nav_internal') {
                        return evt.match
                    }
                    return null
                },
                search: (ctx, evt) => {
                    if (evt.type === 'nav_internal') {
                        return new URLSearchParams(evt.search)
                    }
                    return null
                },
                page: (ctx, evt) => {
                    if (evt.type === 'nav_internal') {
                        const parsed = z.object({ routes: z.record(z.any()) }).parse(ctx)
                        return parsed.routes[evt.match].loader
                    }
                    throw new Error('unreachable')
                }
            }),
            assignFeatures: assign({
                features: (_, evt) => {
                    const data = getFeaturesResponseSchema.parse(/** @type {any} */(evt).data)
                    return data.features
                }
            }),
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
        }
    })

/**
 * @param {Record<string, any>} routes
 * @param {import("history").Location} historyLocation
 * @returns {[string, Record<string, any>] | null | undefined}
 */
function matchAll (routes, historyLocation) {
    for (const key of Object.keys(routes)) {
        if (key === '**') continue
        const param = getRouteMatch(key, historyLocation)
        if (param) {
            return [key, param]
        }
    }
    return null
}

/**
 * @param {string} inputString
 * @param {import("history").Location} historyLocation
 * @returns {Record<string, any> | null}
 */
function getRouteMatch (inputString, historyLocation) {
    // eslint-disable-next-line no-undef
    const pattern = new URLPattern(window.location.origin + inputString)
    const matched = pattern.exec(window.location.origin + historyLocation.pathname)
    if (matched?.pathname?.groups) return matched.pathname.groups
    return null
}
