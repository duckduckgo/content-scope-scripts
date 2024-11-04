import { h, Fragment } from 'preact'
import styles from './DesktopApp.module.css'
import { Background } from './Background.jsx'
import { InfoBar, InfoBarContainer } from './InfoBar.jsx'
import { PlayerContainer } from './PlayerContainer.jsx'
import { Player, PlayerError } from './Player.jsx'
import { useSettings } from '../providers/SettingsProvider.jsx'
import { createAppFeaturesFrom } from '../features/app.js'
import { HideInFocusMode } from './FocusMode.jsx'

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
export function DesktopApp({ embed }) {
    const settings = useSettings()
    const features = createAppFeaturesFrom(settings)
    return (
        <>
            <Background />
            {features.focusMode()}
            <main class={styles.app}>
                <DesktopLayout embed={embed} />
            </main>
        </>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function DesktopLayout({ embed }) {
    return (
        <div class={styles.desktop}>
            <PlayerContainer>
                {embed === null && <PlayerError layout={'desktop'} kind={'invalid-id'} />}
                {embed !== null && <Player src={embed.toEmbedUrl()} layout={'desktop'} />}
                <HideInFocusMode style={'slide'}>
                    <InfoBarContainer>
                        <InfoBar embed={embed} />
                    </InfoBarContainer>
                </HideInFocusMode>
            </PlayerContainer>
        </div>
    )
}
