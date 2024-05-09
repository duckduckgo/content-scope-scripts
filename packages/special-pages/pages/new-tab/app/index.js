import { render, h } from 'preact'
import './styles/global.css'; // global styles
import {Layout} from "./components/Layout";
import {TrackerStats} from "./components/TrackerStats";
import {Favorites} from "./components/Favourites";
import {VisibilityProvider} from "./hooks/useFeatureSetting";
import {TrackerStatsProvider} from "./providers/tracker-stats.provider";
import {Footer} from "./components/Footer";

/**
 * @param {import("../src/js").NewTabPage} messaging
 */
export async function init (messaging) {
    const init = await messaging.init()
    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    render(
        <Layout>
            <VisibilityProvider storageKey="hide_new_tab_page_favorites_feature">
                <Favorites />
            </VisibilityProvider>
            <VisibilityProvider storageKey="hide_new_tab_page_stats_feature">
                <TrackerStatsProvider data={{
                    totalCount: 48_1113,
                    trackerCompanies: [
                        {
                            displayName: 'Google',
                            count: 20,
                        },
                        {
                            displayName: 'Facebook',
                            count: 18,
                        },
                        {
                            displayName: 'Other',
                            count: 210,
                        },
                    ],
                    trackerCompaniesPeriod: "last-day",
                }}>
                    <TrackerStats />
                </TrackerStatsProvider>
            </VisibilityProvider>
            <Footer />
        </Layout>,
        root
    )
}
