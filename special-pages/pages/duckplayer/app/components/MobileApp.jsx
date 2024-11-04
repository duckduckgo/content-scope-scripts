import { h, Fragment } from 'preact'
import cn from 'classnames'
import styles from './MobileApp.module.css'
import { Background } from './Background.jsx'
import { Player, PlayerError } from './Player.jsx'
import { usePlatformName, useSettings } from '../providers/SettingsProvider.jsx'
import { SwitchBarMobile } from './SwitchBarMobile.jsx'
import { MobileWordmark } from './Wordmark.jsx'
import { SwitchProvider } from '../providers/SwitchProvider.jsx'
import { createAppFeaturesFrom } from '../features/app.js'
import { MobileButtons } from './MobileButtons.jsx'
import { OrientationProvider } from '../providers/OrientationProvider.jsx'
import { FocusMode } from './FocusMode.jsx'
import { useTelemetry } from '../types.js'

const DISABLED_HEIGHT = 450

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
export function MobileApp({ embed }) {
    const settings = useSettings()
    const telemetry = useTelemetry()
    const features = createAppFeaturesFrom(settings)
    return (
        <>
            <Background />
            {features.focusMode()}
            <OrientationProvider
                onChange={(orientation) => {
                    if (orientation === 'portrait') {
                        return FocusMode.enable()
                    }
                    // landscape
                    // if the height is too low, just disable it
                    if (window.innerHeight < DISABLED_HEIGHT) {
                        FocusMode.disable()
                        telemetry.landscapeImpression()
                        return
                    }
                    return FocusMode.enable()
                }}
            />
            <MobileLayout embed={embed} />
        </>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobileLayout({ embed }) {
    const platformName = usePlatformName()
    return (
        <main class={styles.main}>
            <div class={cn(styles.filler, styles.hideInFocus)} />
            <div class={styles.embed}>
                {embed === null && <PlayerError layout={'mobile'} kind={'invalid-id'} />}
                {embed !== null && <Player src={embed.toEmbedUrl()} layout={'mobile'} />}
            </div>
            <div class={cn(styles.logo, styles.hideInFocus)}>
                <MobileWordmark />
            </div>
            <div class={cn(styles.switch, styles.hideInFocus)}>
                <SwitchProvider>
                    <SwitchBarMobile platformName={platformName} />
                </SwitchProvider>
            </div>
            <div class={cn(styles.buttons, styles.hideInFocus)}>
                <MobileButtons embed={embed} />
            </div>
        </main>
    )
}
