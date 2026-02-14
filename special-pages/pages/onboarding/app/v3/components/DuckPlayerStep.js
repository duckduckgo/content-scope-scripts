import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { RiveAnimation } from '../../shared/components/RiveAnimation';
import { useBeforeAfter } from '../context/BeforeAfterProvider';
import { SlideIn } from './Animation';

import onboardingAnimation from '../../shared/animations/Onboarding.riv';

import styles from './DuckPlayerStep.module.css';

/**
 * @param {object} props
 * @param {boolean} [props.newDuckPlayerScreen] - When true, the animation is permanently in the 'after' state
 */
export function DuckPlayerStep({ newDuckPlayerScreen = false }) {
    const { isDarkMode, isReducedMotion } = useEnv();
    const [canPlay, setCanPlay] = useState(false);
    const { getStep, setStep } = useBeforeAfter();
    /** @type {import('preact/hooks').MutableRef<ReturnType<setTimeout>|null>} */
    const timer = useRef(null);

    useEffect(() => {
        if (newDuckPlayerScreen) {
            setStep('duckPlayerSingle', 'after');
            return;
        }
        if (canPlay && !timer.current) {
            timer.current = setTimeout(
                () => {
                    setStep('duckPlayerSingle', 'after');
                },
                isReducedMotion ? 100 : 0,
            );
        }

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [canPlay, isReducedMotion, newDuckPlayerScreen]);

    const animationDidEnd = () => {
        if (!timer.current) setCanPlay(true);
    };

    return (
        <SlideIn onAnimationEnd={animationDidEnd}>
            <div className={styles.animationContainer}>
                <RiveAnimation
                    animation={onboardingAnimation}
                    state={newDuckPlayerScreen ? 'after' : (getStep('duckPlayerSingle') || 'before')}
                    isDarkMode={isDarkMode}
                    artboard="Duck Player"
                    inputName="Duck Player?"
                    stateMachine="State Machine 2"
                />
            </div>
        </SlideIn>
    );
}
