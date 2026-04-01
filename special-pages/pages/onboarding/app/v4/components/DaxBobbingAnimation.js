import { h } from 'preact';
import cn from 'classnames';
import styles from './DaxBobbingAnimation.module.css';
import { LottieAnimation } from './LottieAnimation';

/**
 * Lottie animation of Dax bobbing over the background landscape.
 * Rendered by the Background component when background-03 is active.
 * Slide animations are managed here to stay in sync with the background transition.
 *
 * @param {object} props
 * @param {boolean} [props.exiting] - Whether the background is exiting
 */
export function DaxBobbingAnimation({ exiting }) {
    return (
        <LottieAnimation
            class={cn(styles.root, exiting ? styles.slideOut : styles.slideIn)}
            src="assets/lottie/v4/dax-bobbing.json"
            loop={true}
            width={140}
            height={140}
        />
    );
}
