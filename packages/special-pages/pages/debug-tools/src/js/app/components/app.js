import { getMachine } from '../app.machine'
import { createActorContext } from '@xstate/react'
import { Suspense } from 'react'
import * as z from 'zod'
import styles from './app.module.css'
import { FeatureNav } from './feature-nav'

export const baseMachine = getMachine
export const AppMachineContext = createActorContext(baseMachine, { devTools: true })

export function App () {
    const [state] = AppMachineContext.useActor()

    if (state.matches('showing error')) {
        return <div className="initial-loader">
            <pre><code>{state.context.error}</code></pre>
        </div>
    }
    if (!state.matches(['routes ready'])) {
        return (
            <div className="initial-loader">
                <p>Collecting Debug Data...</p>
            </div>
        )
    }

    return <AppShell />
}

function AppShell () {
    // Read full snapshot and get `send` function from `useActor()`
    const { Page, links } = AppMachineContext.useSelector((state) => {
        const parsed = z.object({
            page: z.any(),
            params: z.any(),
            routes: z.record(z.object({ feature: z.string(), title: z.string() })),
            features: z.record(z.any()),
            match: z.string()
        }).parse(state.context)
        const links = []
        const seen = new Set()
        const supportedFeatures = Object.keys(parsed.features)
        for (const [match, route] of Object.entries(parsed.routes)) {
            if (match === '**') continue
            if (!supportedFeatures.includes(route.feature)) continue
            if (seen.has(route.feature)) continue
            seen.add(route.feature)
            const curr = parsed.routes[parsed.match]
            links.push({
                name: route.title,
                active: curr.feature === route.feature,
                url: '/' + route.feature
            })
        }
        return {
            Page: parsed.page,
            links
        }
    })

    return (
        <div data-loaded="true" className={styles.appShell}>
            <header className={styles.appHeader}>
                <FeatureNav links={links} />
            </header>
            {/*<p>Main</p>*/}
            <Suspense fallback={null}>
                <Page />
            </Suspense>
        </div>
    )
}
