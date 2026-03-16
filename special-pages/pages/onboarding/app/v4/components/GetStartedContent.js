import { h } from 'preact';
import cn from 'classnames';
import { useTypedTranslation } from '../../types';
import { Typed } from '../../shared/components/Typed';
import { Button } from './Button';
import { Container } from './Container';
import { Title } from './Title';
import { useTypingEffect } from './TypingEffectContext';
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
    const { isTyping, hideContent, typingPaused, onTitleComplete } = useTypingEffect();
    const [title, body] = t('getStarted_title_v4', { newline: '\n' }).split('{paragraph}');

    return (
        <Container class={styles.root}>
            <div class={styles.text}>
                <Title class={styles.title}>
                    {isTyping ? <Typed text={title} paused={typingPaused} onComplete={onTitleComplete} /> : title}
                </Title>
                <p class={cn(styles.body, { [styles.revealable]: isTyping, [styles.hidden]: hideContent })}>{body}</p>
            </div>
            <div class={cn({ [styles.revealable]: isTyping, [styles.hidden]: hideContent })}>
                <Button size="stretch" onClick={advance}>
                    {t('getStartedButton_v4')}
                </Button>
            </div>
        </Container>
    );
}
