import { h, hydrate} from 'preact'
import './styles/global.css' // global styles
import { Layout } from './components/Layout'
import { TrackerStats } from './components/TrackerStats'
import { Favorites } from './components/Favourites'
import { VisibilityProvider } from './hooks/useFeatureSetting'
import { TrackerStatsProvider } from './providers/tracker-stats.provider'
import { Footer } from './components/Footer'
import { stats } from './data'

/**
 * @param {import("../src/js").NewTabPage} messaging
 * @param {'debug' | 'production'} mode
 */
export async function init (messaging, mode = 'production') {
    const init = await messaging.init()
    console.log(init)
    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')
    const url = new URL(window.location.href)
    const key = mode === 'debug'
        ? url.searchParams.get('stats') || 'few'
        : 'none'
    const trackerStats = stats[key] || stats.few

    hydrate(
        <Layout>
            <VisibilityProvider storageKey="hide_new_tab_page_favorites_feature">
                <Favorites />
            </VisibilityProvider>
            <VisibilityProvider storageKey="hide_new_tab_page_stats_feature">
                <TrackerStatsProvider data={trackerStats}>
                    <TrackerStats />
                </TrackerStatsProvider>
            </VisibilityProvider>
            <Footer />
        </Layout>,
        root
    )
}
