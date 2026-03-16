import { h } from 'preact';
import cn from 'classnames';
import { Typed } from '../../shared/components/Typed';
import { useTypingEffect } from './TypingEffectContext';
import styles from './StepHeader.module.css';

/**
 * Top bubble header with title and optional subtitle.
 * Used by systemSettings, customize, and duckPlayer.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 */
export function StepHeader({ title, subtitle }) {
    const { isTyping, hideContent, typingPaused, onTitleComplete } = useTypingEffect();

    return (
        <div class={styles.root}>
            <h2 class={styles.title}>{isTyping ? <Typed text={title} paused={typingPaused} onComplete={onTitleComplete} /> : title}</h2>
            {subtitle && <p class={cn(styles.subtitle, { [styles.hidden]: hideContent })}>{subtitle}</p>}
        </div>
    );
}
