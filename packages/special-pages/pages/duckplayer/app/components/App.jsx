import { h, Fragment } from "preact";
import styles from "./App.module.css";
import { Background } from "./Background.jsx";
import { InfoBar, InfoBarContainer } from "./InfoBar.jsx";
import { PlayerContainer, PlayerInternal } from "./PlayerContainer.jsx";
import { Player, PlayerError } from "./Player.jsx";
import {
    useLayout,
    useOpenInfoHandler,
    useOpenOnYoutubeHandler,
    useOpenSettingsHandler, usePlatformName, useSettings
} from "../providers/SettingsProvider.jsx";
import { SwitchBarMobile } from "./SwitchBarMobile.jsx";
import { Button, Icon } from "./Button.jsx";
import info from "../img/info.data.svg";
import cog from "../img/cog.data.svg";
import { BottomNavBar, FloatingBar, TopBar } from "./FloatingBar.jsx";
import { Wordmark } from "./Wordmark.jsx";
import { SwitchProvider } from "../providers/SwitchProvider.jsx";
import { createAppFeaturesFrom } from "../features/app.js";
import { useTypedTranslation } from "../types.js";


/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
export function App({ embed }) {
    const layout = useLayout();
    const settings = useSettings();
    const features = createAppFeaturesFrom(settings)
    return (
        <>
            <Background />
            {features.focusMode()}
            <main class={styles.app}>
                {layout === 'desktop' && <DesktopLayout embed={embed} />}
                {layout === 'mobile' && <MobileLayout embed={embed} />}
            </main>
        </>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function DesktopLayout({embed}) {
    return (
        <div class={styles.desktop}>
            <PlayerContainer>
                {embed === null && <PlayerError layout={'desktop'} kind={'invalid-id'} />}
                {embed !== null && <Player src={embed.toEmbedUrl()} layout={'desktop'} />}
                <HideInFocusMode style={"slide"}>
                    <InfoBarContainer>
                        <InfoBar embed={embed}/>
                    </InfoBarContainer>
                </HideInFocusMode>
            </PlayerContainer>
        </div>
    )
}

function HideInFocusMode({children, style="fade"}) {
    return (
        <div class={styles.hideInFocus} data-style={style}>{children}</div>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobileLayout({embed}) {
    return (
        <div class={styles.mobile}>
            <div class={styles.header}>
                <HideInFocusMode>
                    <MobileHeader />
                </HideInFocusMode>
            </div>
            <div class={styles.main}>
                <MobilePlayer embed={embed} />
            </div>
            <div class={styles.footer}>
                <HideInFocusMode>
                    <MobileFooter embed={embed} />
                </HideInFocusMode>
            </div>
        </div>
    )
}

function MobileHeader() {
    return (
        <TopBar>
            <Wordmark />
        </TopBar>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobilePlayer({embed}) {
    const platformName = usePlatformName();
    return (
        <PlayerContainer inset>
            <PlayerInternal inset>
                {embed === null && <PlayerError layout={'mobile'} kind={'invalid-id'} />}
                {embed !== null && <Player src={embed.toEmbedUrl()} layout={'mobile'} />}
                <SwitchProvider>
                    <SwitchBarMobile platformName={platformName} />
                </SwitchProvider>
            </PlayerInternal>
        </PlayerContainer>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobileFooter({ embed }) {
    const openSettings = useOpenSettingsHandler();
    const openInfo = useOpenInfoHandler();
    const openOnYoutube = useOpenOnYoutubeHandler();
    const { t } = useTypedTranslation();
    return (
        <BottomNavBar>
            <FloatingBar>
                <Button
                    icon={true}
                    buttonProps={{
                        "aria-label": t('openInfoButton'),
                        onClick: openInfo
                    }}
                ><Icon src={info}/></Button>
                <Button
                    icon={true}
                    buttonProps={{
                        "aria-label": t('openSettingsButton'),
                        onClick: openSettings
                    }}
                ><Icon src={cog}/></Button>
                <Button fill={true}
                        buttonProps={{
                            onClick: () => {
                                if (embed) openOnYoutube(embed)
                            }
                        }}
                >{t('watchOnYoutube')}</Button>
            </FloatingBar>
        </BottomNavBar>
    )
}


