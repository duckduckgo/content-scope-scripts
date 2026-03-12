import { h } from 'preact';
import { useContext } from 'preact/hooks';
import cn from 'classnames';
import { GlobalContext } from '../../global';
import styles from './SystemSettingsAnimation.module.css';
import { LottieAnimation } from './LottieAnimation';

/**
 * Background lottie layer of the Dax illustration for the systemSettings step.
 * Renders behind the bottom bubble content.
 */
export function SystemSettingsBackground() {
    const { exiting } = useContext(GlobalContext);
    return (
        <LottieAnimation
            class={cn(styles.background, exiting && styles.fadeOut)}
            src="assets/lottie/v4/dax-in-spotlight-pointing-background.json"
            darkSrc="assets/lottie/v4/dax-in-spotlight-pointing-background-dark.json"
            width={170}
            height={170}
        />
    );
}

/**
 * Foreground lottie layer of the Dax illustration for the systemSettings step.
 * Renders the wing that overlaps the bottom bubble border.
 */
export function SystemSettingsForeground() {
    const { exiting } = useContext(GlobalContext);
    return (
        <LottieAnimation
            class={cn(styles.foreground, exiting && styles.fadeOut)}
            src="assets/lottie/v4/dax-in-spotlight-pointing-foreground.json"
            width={170}
            height={170}
        />
    );
}
