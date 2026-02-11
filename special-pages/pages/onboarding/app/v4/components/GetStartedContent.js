import { h } from 'preact';
import { useTypedTranslation } from '../../types';
import styles from './GetStartedContent.module.css';

/**
 * Bubble content for the getStarted step.
 * Renders title, body text, and CTA button.
 *
 * @param {object} props
 * @param {() => void} props.onAdvance
 */
export function GetStartedContent({ onAdvance }) {
    const { t } = useTypedTranslation();
    const parts = t('getStarted_title_v3', { newline: '\n' }).split('{paragraph}');
    const title = parts[0];
    const body = parts.slice(1).join('');

    return (
        <div class={styles.root}>
            <div class={styles.text}>
                <h2 class={styles.title}>{title}</h2>
                <p class={styles.body}>{body}</p>
            </div>
            <div class={styles.actions}>
                <button class={styles.button} onClick={onAdvance}>
                    {t('getStartedButton_v3')}
                </button>
            </div>
        </div>
    );
}
