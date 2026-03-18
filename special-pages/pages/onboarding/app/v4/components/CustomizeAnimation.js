import { h } from 'preact';
import cn from 'classnames';
import styles from './CustomizeAnimation.module.css';
import { LottieAnimation } from './LottieAnimation';

/**
 * Lottie animation of Dax bobbing for the customize step.
 * Positioned at the bottom center of the viewport, over the background landscape.
 * Slide animations are managed here to stay in sync with the Background component.
 *
 * @param {object} props
 * @param {boolean} [props.exiting] - Whether the customize background is exiting
 */
export function CustomizeAnimation({ exiting }) {
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
