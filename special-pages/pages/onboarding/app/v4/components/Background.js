import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import cn from 'classnames';
import { GlobalContext } from '../../global';
import { ORDER_V4 } from '../../types';
import styles from './Background.module.css';

/**
 * Returns CSS custom property values for a step's background SVGs.
 * @param {import('../../types').Step['id']} step
 */
function bgVars(step) {
    const idx = ORDER_V4.indexOf(step);
    const num = String(idx + 1).padStart(2, '0');
    return {
        '--bg-light': `url("../assets/img/v4/background-${num}-light.svg")`,
        '--bg-dark': `url("../assets/img/v4/background-${num}-dark.svg")`,
    };
}

/**
 * Step-specific background for v4 onboarding.
 * Each step's background illustration crossfades on transition:
 * the previous step's background slides out + fades while the
 * new step's background slides in.
 */
export function Background() {
    const { activeStep } = useContext(GlobalContext);
    const [prevStep, setPrevStep] = useState(activeStep);
    const [exitingStep, setExitingStep] = useState(/** @type {import('../../types').Step['id'] | null} */ (null));

    // Detect step change during render — no useEffect needed.
    // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (prevStep !== activeStep) {
        setPrevStep(activeStep);
        setExitingStep(prevStep);
    }

    return (
        <div class={styles.background}>
            {exitingStep && (
                <div
                    key={'exit-' + exitingStep}
                    class={cn(styles.illustration, styles.outro)}
                    style={bgVars(exitingStep)}
                    onAnimationEnd={() => setExitingStep(null)}
                />
            )}
            <div key={activeStep} class={cn(styles.illustration, styles.intro)} style={bgVars(activeStep)} />
        </div>
    );
}
