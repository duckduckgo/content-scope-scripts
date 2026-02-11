import { h } from 'preact';
import { LottieAnimation } from './LottieAnimation';
import { Timeout } from '../../shared/components/Timeout';
import { useTypedTranslation } from '../../types';
import styles from './WelcomeContent.module.css';

/**
 * @param {object} props
 * @param {() => void} props.onComplete - Called when the welcome step should advance
 */
export function WelcomeContent({ onComplete }) {
    const { t } = useTypedTranslation();
    return (
        <div class={styles.root}>
            <LottieAnimation src="assets/lottie/v4/dax-logo.json" width={80} height={80} />
            <h1 class={styles.title}>{t('welcome_title')}</h1>
            <Timeout onComplete={onComplete} ignore={true} />
        </div>
    );
}
