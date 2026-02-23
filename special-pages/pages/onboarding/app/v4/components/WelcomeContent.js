import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { LottieAnimation } from './LottieAnimation';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { useTypedTranslation } from '../../types';
import styles from './WelcomeContent.module.css';

const WELCOME_ANIMATION_MS = 3033;

/**
 * @param {object} props
 * @param {() => void} props.onComplete - Called when the welcome step should advance
 */
export function WelcomeContent({ onComplete }) {
    const { isReducedMotion } = useEnv();
    const { t } = useTypedTranslation();
    const didComplete = useRef(false);

    const complete = () => {
        if (!didComplete.current) {
            didComplete.current = true;
            onComplete();
        }
    };

    // Reduced motion: skip the animation and advance after a brief timeout
    useEffect(() => {
        if (!isReducedMotion) return;
        const timer = setTimeout(complete, WELCOME_ANIMATION_MS);
        return () => clearTimeout(timer);
    }, [isReducedMotion]);

    return (
        <div class={styles.root} onAnimationEnd={complete}>
            <LottieAnimation class={styles.logo} src="assets/lottie/v4/dax-logo.json" width={80} height={80} />
            <h1 class={styles.title}>{t('welcome_title')}</h1>
        </div>
    );
}
