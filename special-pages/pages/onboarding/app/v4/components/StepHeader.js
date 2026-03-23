import { h } from 'preact';
import cn from 'classnames';
import { Typed } from '../../shared/components/Typed';
import { useTypingEffect } from '../../shared/components/SettingsProvider';
import { useGlobalState } from '../../global';
import styles from './StepHeader.module.css';

/**
 * Top bubble header with title and optional subtitle.
 * Used by systemSettings, customize, and duckPlayer.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {() => void} props.onTitleComplete
 */
export function StepHeader({ title, subtitle, onTitleComplete }) {
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible } = useGlobalState();

    return (
        <div class={styles.root}>
            <h2 class={styles.title}>
                {hasTypingEffect ? (
                    <Typed
                        text={title}
                        startDelay={800} // fade-in delay + duration + pause
                        onComplete={onTitleComplete}
                    />
                ) : (
                    title
                )}
            </h2>
            {subtitle && <p class={cn(styles.subtitle, { [styles.hidden]: hasTypingEffect && !activeStepVisible })}>{subtitle}</p>}
        </div>
    );
}
