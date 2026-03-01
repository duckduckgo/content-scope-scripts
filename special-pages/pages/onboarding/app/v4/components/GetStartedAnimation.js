import { h } from 'preact';
import { useContext } from 'preact/hooks';
import cn from 'classnames';
import { GlobalContext } from '../../global';
import styles from './GetStartedAnimation.module.css';
import { LottieAnimation } from './LottieAnimation';

/**
 * Lottie animation of Dax the Duck for the getStarted step.
 *
 * @param {object} props
 * @param {string} [props.class] - Optional CSS class
 */
export function GetStartedAnimation({ class: className }) {
    const { exiting } = useContext(GlobalContext);
    return (
        <LottieAnimation
            class={cn(styles.root, exiting && styles.fadeOut, className)}
            src="assets/lottie/v4/dax-in-spotlight-thumbs-up.json"
            width={274}
            height={274}
        />
    );
}
