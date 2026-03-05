import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import cn from 'classnames';
import { GlobalContext } from '../../global';
import { ORDER_V4 } from '../../types';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import styles from './Background.module.css';

/**
 * @param {object} props
 * @param {import('../../types').Step['id']} props.step
 * @param {string} props.class
 * @param {boolean} props.isDarkMode
 * @param {(() => void)} [props.onAnimationEnd]
 */
function Illustration({ step, class: className, isDarkMode, onAnimationEnd }) {
    const idx = ORDER_V4.indexOf(step);
    const num = String(idx + 1).padStart(2, '0');
    const src = isDarkMode ? `assets/img/v4/background-${num}-dark.svg` : `assets/img/v4/background-${num}-light.svg`;
    return (
        <picture class={cn(className, step === 'welcome' && styles.rightAligned)} onAnimationEnd={onAnimationEnd}>
            <img src={src} alt="" />
        </picture>
    );
}

/**
 * Step-specific background for v4 onboarding.
 * Each step's background illustration slides in from the bottom on transition:
 * the previous step's background slides out + fades while the
 * new step's background slides in.
 */
export function Background() {
    const { activeStep } = useContext(GlobalContext);
    const { isDarkMode } = useEnv();
    const [prevStep, setPrevStep] = useState(activeStep);
    const [exitingStep, setExitingStep] = useState(/** @type {import('../../types').Step['id'] | null} */ (null));

    if (prevStep !== activeStep) {
        setPrevStep(activeStep);
        setExitingStep(prevStep);
    }

    return (
        <div class={styles.background}>
            {exitingStep && (
                <Illustration
                    key={exitingStep}
                    step={exitingStep}
                    isDarkMode={isDarkMode}
                    class={cn(styles.illustration, styles.slideOut)}
                    onAnimationEnd={() => setExitingStep(null)}
                />
            )}
            <Illustration key={activeStep} step={activeStep} isDarkMode={isDarkMode} class={cn(styles.illustration, styles.slideIn)} />
        </div>
    );
}
