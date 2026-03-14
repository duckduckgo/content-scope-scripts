import { h } from 'preact';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import { Container } from './Container';
import { Title } from './Title';
import styles from './GetStartedContent.module.css';

/**
 * Bubble content for the getStarted step.
 * Renders title, body text, and CTA button.
 *
 * @param {object} props
 * @param {() => void} props.advance
 */
export function GetStartedContent({ advance }) {
    const { t } = useTypedTranslation();
    const [title, body] = t('getStarted_title_v4', { newline: '\n' }).split('{paragraph}');

    return (
        <Container class={styles.root}>
            <div class={styles.text}>
                <Title class={styles.title}>{title}</Title>
                <p class={styles.body}>{body}</p>
            </div>
            <Button size="stretch" onClick={advance}>
                {t('getStartedButton_v4')}
            </Button>
        </Container>
    );
}
