import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { useBeforeAfter } from '../context/BeforeAfterProvider';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { RiveAnimation } from '../../shared/components/RiveAnimation';
import { Button } from './Button';
import onboardingAnimation from '../../shared/animations/Onboarding.riv';
import styles from './DuckPlayerContent.module.css';

/**
 * Bottom bubble content for the duckPlayerSingle step.
 * Shows the Duck Player before/after animation, a toggle button, and a Next button.
 */
export function DuckPlayerContent() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);
    const { getStep, setStep } = useBeforeAfter();
    const { isDarkMode } = useEnv();

    const beforeAfterState = getStep('duckPlayerSingle');

    const advance = () => dispatch({ kind: 'advance' });
    const toggleBeforeAfter = () => {
        setStep('duckPlayerSingle', beforeAfterState === 'after' ? 'before' : 'after');
    };

    return (
        <div class={styles.root}>
            {/* TODO: Replace v3 Rive animation with v4 Lottie animation */}
            <div class={styles.animationContainer}>
                <RiveAnimation
                    animation={onboardingAnimation}
                    state={beforeAfterState || 'before'}
                    isDarkMode={isDarkMode}
                    artboard="Duck Player"
                    inputName="Duck Player?"
                    stateMachine="State Machine 2"
                />
            </div>
            <div class={styles.buttons}>
                <Button variant="secondary" onClick={toggleBeforeAfter} class={styles.flexButton}>
                    {beforeAfterState === 'after' ? t('beforeAfter_duckPlayer_hide') : t('beforeAfter_duckPlayer_show')}
                </Button>
                <Button variant="primary" onClick={advance} class={styles.flexButton}>
                    {t('nextButton')}
                </Button>
            </div>
        </div>
    );
}
