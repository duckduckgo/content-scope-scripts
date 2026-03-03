import { h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { RiveAnimation } from '../../shared/components/RiveAnimation';
import { Button } from './Button';
import { LottieAnimation } from './LottieAnimation';
import styles from './DuckPlayerContent.module.css';
import onboardingAnimation from '../../shared/animations/Onboarding.riv';

/**
 * Bottom bubble content for the duckPlayerSingle step.
 *
 * - variant 'ad-free': static promo image + single Next button
 * - default (no variant): Rive animation with before/after toggle + Next button
 *
 * @param {object} props
 * @param {boolean} props.isAdFree
 */
export function DuckPlayerContent({ isAdFree }) {
    if (isAdFree) {
        return <DuckPlayerAdFree />;
    }
    return <DuckPlayerDefault />;
}

/**
 * Ad-free variant: static promo image + Next button.
 */
function DuckPlayerAdFree() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);

    const advance = () => dispatch({ kind: 'enqueue-next' });

    return (
        <div class={styles.root}>
            <div class={styles.imageContainer}>
                <img src="assets/img/v4/duck-player-promo.svg" alt="" class={styles.promoImage} />
                <LottieAnimation src="assets/lottie/v4/sparkle.json" class={styles.sparkle} width={34} height={43} />
            </div>
            <Button variant="primary" size="stretch" onClick={advance}>
                {t('nextButton')}
            </Button>
        </div>
    );
}

/**
 * Default variant: Rive animation with before/after toggle + Next button.
 */
function DuckPlayerDefault() {
    const { t } = useTypedTranslation();
    const { isDarkMode, isReducedMotion } = useEnv();
    const dispatch = useContext(GlobalDispatch);

    const [animationState, setAnimationState] = useState(/** @type {'before' | 'after'} */ ('before'));
    const [toggleState, setToggleState] = useState(/** @type {'before' | 'after'} */ ('after'));

    // Auto-transition the Rive animation to 'after' after the bubble entry animation completes
    // (400ms fade-in delay + 267ms fade-in duration = 667ms)
    useEffect(() => {
        const id = setTimeout(() => setAnimationState('after'), isReducedMotion ? 0 : 667);
        return () => clearTimeout(id);
    }, [isReducedMotion]);

    const toggle = () => {
        const next = toggleState === 'before' ? 'after' : 'before';
        setToggleState(next);
        setAnimationState(next);
    };
    const advance = () => dispatch({ kind: 'enqueue-next' });

    return (
        <div class={styles.root}>
            <div class={styles.animationContainer}>
                <RiveAnimation
                    animation={onboardingAnimation}
                    state={animationState}
                    isDarkMode={isDarkMode}
                    artboard="Duck Player"
                    inputName="Duck Player?"
                    stateMachine="State Machine 2"
                />
            </div>
            <div class={styles.actions}>
                <Button variant="secondary" class={styles.toggleButton} onClick={toggle}>
                    {toggleState === 'after' ? t('beforeAfter_duckPlayer_hide') : t('beforeAfter_duckPlayer_show')}
                </Button>
                <Button variant="primary" class={styles.nextButton} onClick={advance}>
                    {t('nextButton')}
                </Button>
            </div>
        </div>
    );
}
