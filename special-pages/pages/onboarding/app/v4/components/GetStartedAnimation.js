import { h } from 'preact';
import cn from 'classnames';
import { useGlobalState } from '../../global';
import styles from './GetStartedAnimation.module.css';
import { LottieAnimation } from './LottieAnimation';

/**
 * Lottie animation of Dax the Duck for the getStarted step.
 *
 * @param {object} props
 * @param {string} [props.class] - Optional CSS class
 */
export function GetStartedAnimation({ class: className }) {
    const { exiting } = useGlobalState();
    return (
        <LottieAnimation
            class={cn(styles.root, exiting && styles.fadeOut, className)}
            src="assets/lottie/v4/dax-in-spotlight-thumbs-up.json"
            darkSrc="assets/lottie/v4/dax-in-spotlight-thumbs-up-dark.json"
            width={274}
            height={274}
        />
    );
}
