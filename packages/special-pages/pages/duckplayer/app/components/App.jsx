import { h, Fragment } from "preact";
import cn from "classnames";
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
import { FloatingBar, TopBar } from "./FloatingBar.jsx";
import { Wordmark } from "./Wordmark.jsx";
import { SwitchProvider } from "../providers/SwitchProvider.jsx";
import { OrientationProvider, useOrientation } from "../providers/OrientationProvider.jsx";
import { createAppFeaturesFrom } from "../features/app.js";
import { useTypedTranslation } from "../types.js";
import { HideInFocusMode } from "./FocusMode.jsx";


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
                {layout === 'mobile' && (
                    <OrientationProvider>
                        <MobileLayout embed={embed} />
                    </OrientationProvider>
                )}
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

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobileLayout({embed}) {
    const orientation = useOrientation();
    const platformName = usePlatformName();
    const insetPlayer = orientation === "portrait";
    const classes = cn({
        [styles.portrait]: orientation === "portrait",
        [styles.landscape]: orientation === "landscape"
    });
    return (
        <div class={classes}>
            {orientation === "portrait" && (
                <div class={styles.header}>
                    <HideInFocusMode>
                        <TopBar>
                            <Wordmark />
                        </TopBar>
                    </HideInFocusMode>
                </div>
            )}
            <div class={styles.wrapper}>
                <div class={styles.main}>
                    <PlayerContainer inset={insetPlayer}>
                        <PlayerInternal inset={insetPlayer}>
                            {embed === null && <PlayerError layout={'mobile'} kind={'invalid-id'}/>}
                            {embed !== null && <Player src={embed.toEmbedUrl()} layout={'mobile'}/>}
                            {orientation === "portrait" && (
                                <SwitchProvider>
                                    <SwitchBarMobile platformName={platformName} />
                                </SwitchProvider>
                            )}
                        </PlayerInternal>
                    </PlayerContainer>
                </div>
                {orientation === "landscape" && <LandscapeControls embed={embed} platformName={platformName}/>}
                {orientation === "portrait" && <PortraitControls embed={embed} />}
            </div>
        </div>
    )
}

/**
 * How the controls are rendered in Portrait mode.
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function PortraitControls({embed}) {
    return (
        <div className={styles.controls}>
            <HideInFocusMode>
                <FloatingBar inset>
                    <MobileFooter embed={embed}/>
                </FloatingBar>
            </HideInFocusMode>
        </div>
    )
}

/**
 * How the controls are rendered in Landscape mode
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 * @param {ImportMeta['platform']} props.platformName - The name of the platform.
 */
function LandscapeControls({embed, platformName}) {
    return (
        <div className={styles.rhs}>
            <div className={styles.header}>
                <HideInFocusMode>
                    <TopBar>
                        <Wordmark />
                    </TopBar>
                </HideInFocusMode>
            </div>
            <div className={styles.controls}>
                <HideInFocusMode>
                    <FloatingBar>
                        <MobileFooter embed={embed}/>
                    </FloatingBar>
                </HideInFocusMode>
            </div>
            <div className={styles.switch}>
                <SwitchProvider>
                    <SwitchBarMobile platformName={platformName}/>
                </SwitchProvider>
            </div>
        </div>
    )
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function MobileFooter({embed}) {
    const openSettings = useOpenSettingsHandler();
    const openInfo = useOpenInfoHandler();
    const openOnYoutube = useOpenOnYoutubeHandler();
    const {t} = useTypedTranslation();
    return (
        <>
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
        </>
    )
}


