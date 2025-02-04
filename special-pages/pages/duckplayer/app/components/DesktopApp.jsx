import { h, Fragment } from 'preact';
import styles from './DesktopApp.module.css';
import { InfoBar, InfoBarContainer } from './InfoBar.jsx';
import { PlayerContainer } from './PlayerContainer.jsx';
import { Player, PlayerError, YouTubeError } from './Player.jsx';
import { useSettings } from '../providers/SettingsProvider.jsx';
import { createAppFeaturesFrom } from '../features/app.js';
import { HideInFocusMode } from './FocusMode.jsx';
import { useYouTubeError } from '../providers/YouTubeErrorProvider';

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
export function DesktopApp({ embed }) {
    const settings = useSettings();
    const features = createAppFeaturesFrom(settings);
    const ytError = useYouTubeError();

    return (
        <>
            {!ytError && features.focusMode()}
            <main class={styles.app}>
                <DesktopLayout embed={embed} />
            </main>
        </>
    );
}

/**
 * @param {object} props
 * @param {import("../embed-settings.js").EmbedSettings|null} props.embed
 */
function DesktopLayout({ embed }) {
    const error = useYouTubeError();
    const settings = useSettings();
    const showCustomError = error && settings.customError?.state === 'enabled';

    // TODO: Better conditionals for showing error or player

    return (
        <div class={styles.desktop}>
            <PlayerContainer>
                {embed === null && <PlayerError layout={'desktop'} />}
                {embed !== null && showCustomError && <YouTubeError layout={'desktop'} kind={error} />}
                {embed !== null && !showCustomError && <Player src={embed.toEmbedUrl()} layout={'desktop'} />}
                <HideInFocusMode style={'slide'}>
                    <InfoBarContainer>
                        <InfoBar embed={embed} />
                    </InfoBarContainer>
                </HideInFocusMode>
            </PlayerContainer>
        </div>
    );
}
