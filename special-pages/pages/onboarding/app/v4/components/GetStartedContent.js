import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import styles from './GetStartedContent.module.css';

/**
 * Bubble content for the getStarted step.
 * Renders title, body text, and CTA button.
 */
export function GetStartedContent() {
    const dispatch = useContext(GlobalDispatch);
    const { t } = useTypedTranslation();
    const parts = t('getStarted_title_v4', { newline: '\n' }).split('{paragraph}');
    const title = parts[0];
    const body = parts.slice(1).join('');

    const handleClick = () => {
        dispatch({ kind: 'enqueue-next' });
    };

    return (
        <div class={styles.root}>
            <div class={styles.text}>
                <h2 class={styles.title}>{title}</h2>
                <p class={styles.body}>{body}</p>
            </div>
            <div class={styles.actions}>
                <Button size="stretch" onClick={handleClick}>
                    {t('getStartedButton_v4')}
                </Button>
            </div>
        </div>
    );
}
