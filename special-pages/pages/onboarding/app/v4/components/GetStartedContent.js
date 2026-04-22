import { h } from 'preact';
import cn from 'classnames';
import { useTypedTranslation } from '../../types';
import { Typed } from './Typed';
import { useTypingEffect } from '../../shared/components/SettingsProvider';
import { useGlobalState } from '../../global';
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
 * @param {() => void} props.onTitleComplete
 */
export function GetStartedContent({ advance, onTitleComplete }) {
    const { t } = useTypedTranslation();
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible } = useGlobalState();

    const [title, body] = t('getStarted_title_v4', { newline: '\n' }).split('{paragraph}');

    return (
        <Container class={styles.root}>
            <div class={styles.text}>
                <Title class={styles.title}>
                    {hasTypingEffect ? (
                        <Typed
                            text={title}
                            startDelay={800} // fade-in delay + duration + pause
                            onComplete={onTitleComplete}
                        />
                    ) : (
                        title
                    )}
                </Title>
                <p
                    class={cn(styles.body, {
                        [styles.revealable]: hasTypingEffect,
                        [styles.hidden]: hasTypingEffect && !activeStepVisible,
                    })}
                >
                    {body}
                </p>
            </div>
            <Button
                class={cn({ [styles.revealable]: hasTypingEffect, [styles.hidden]: hasTypingEffect && !activeStepVisible })}
                size="stretch"
                onClick={advance}
            >
                {t('getStartedButton_v4')}
            </Button>
        </Container>
    );
}
