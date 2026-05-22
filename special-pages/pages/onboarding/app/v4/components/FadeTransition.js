import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import styles from './FadeTransition.module.css';

/**
 * Crossfades between children when `transitionKey` changes.
 * Plays fade-out on the old content, swaps, then fades in the new content.
 *
 * @param {object} props
 * @param {string} props.transitionKey - When this value changes the transition starts
 * @param {import('preact').ComponentChildren} props.children
 */
export function FadeTransition({ transitionKey, children }) {
    const { isReducedMotion } = useEnv();

    const [snapshot, setSnapshot] = useState({ key: transitionKey, content: children });
    const [phase, setPhase] = useState(/** @type {'idle' | 'exiting' | 'entering'} */ ('idle'));

    if (transitionKey !== snapshot.key && phase === 'idle') {
        if (isReducedMotion) {
            setSnapshot({ key: transitionKey, content: children });
        } else {
            setPhase('exiting');
        }
    }

    /** @param {import('preact').JSX.TargetedAnimationEvent<HTMLDivElement>} e */
    const advance = (e) => {
        if (e.target !== e.currentTarget) return;
        if (phase === 'exiting') {
            setSnapshot({ key: transitionKey, content: children });
            setPhase('entering');
        } else if (phase === 'entering') {
            setPhase('idle');
        }
    };

    return (
        <div class={cn(phase === 'exiting' && styles.fadeOut, phase === 'entering' && styles.fadeIn)} onAnimationEnd={advance}>
            {phase === 'idle' ? children : snapshot.content}
        </div>
    );
}
