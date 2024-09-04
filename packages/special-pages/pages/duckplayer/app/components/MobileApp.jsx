import { h, Fragment } from "preact";
import cn from "classnames";
import styles from "./MobileApp.module.css";
import { Background } from "./Background.jsx";
import { Player, PlayerError } from "./Player.jsx";
import {
    usePlatformName,
    useSettings
} from "../providers/SettingsProvider.jsx";
import { SwitchBarMobile } from "./SwitchBarMobile.jsx";
import { MobileWordmark } from "./Wordmark.jsx";
import { SwitchProvider } from "../providers/SwitchProvider.jsx";
import { createAppFeaturesFrom } from "../features/app.js";
import { MobileButtons } from "./MobileButtons.jsx";


/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
export function MobileApp({ embed }) {
    const settings = useSettings();
    const features = createAppFeaturesFrom(settings)
    return (
        <>
            <Background />
            {features.focusMode()}
            <MobileLayout embed={embed} />
        </>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobileLayout({embed}) {
    const platformName = usePlatformName();
    return (
        <main class={styles.main}>
            <div class={cn(styles.filler, styles.hideInFocus)} />
            <div class={styles.embed}>
                {embed === null && <PlayerError layout={'mobile'} kind={'invalid-id'}/>}
                {embed !== null && <Player src={embed.toEmbedUrl()} layout={'mobile'}/>}
            </div>
            <div class={cn(styles.logo, styles.hideInFocus)}>
                <MobileWordmark />
            </div>
            <div class={cn(styles.switch, styles.hideInFocus)}>
                <SwitchProvider>
                    <SwitchBarMobile platformName={platformName}/>
                </SwitchProvider>
            </div>
            <div class={cn(styles.buttons, styles.hideInFocus)}>
                <MobileButtons embed={embed} />
            </div>
        </main>
    )
}

