import { render, h } from 'preact'
import './styles/global.css'; // global styles
import {Layout} from "./components/Layout";
import {TrackerStats} from "./components/TrackerStats";
import {Favorites} from "./components/Favourites";

/**
 * @param {import("../src/js").NewTabPage} messaging
 */
export async function init (messaging) {
    const init = await messaging.init()
    console.log('init response:', init)
    const root = document.querySelector('#app')
    if (!root) throw new Error('could not render, root element missing')

    render(
        <Layout>
            <Favorites />
            <TrackerStats />
        </Layout>,
        root
    )
}
