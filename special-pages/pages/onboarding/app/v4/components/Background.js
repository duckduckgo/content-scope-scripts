import { h } from 'preact';
import { useContext } from 'preact/hooks';
import cn from 'classnames';
import { GlobalContext } from '../../global';
import { ORDER_V4 } from '../../types';
import styles from './Background.module.css';

/**
 * Step-specific background for v4 onboarding.
 * Shows a plain white/dark background with a per-step SVG illustration
 * fixed to the bottom center of the viewport.
 */
export function Background() {
    const { activeStep } = useContext(GlobalContext);
    const stepIndex = ORDER_V4.indexOf(activeStep);
    const stepNumber = String(stepIndex + 1).padStart(2, '0');

    return (
        <div class={styles.background}>
            <div
                class={cn(styles.illustration, activeStep === 'welcome' && styles.welcomeAnimation)}
                style={{
                    '--bg-light': `url("../assets/img/v4/background-${stepNumber}-light.svg")`,
                    '--bg-dark': `url("../assets/img/v4/background-${stepNumber}-dark.svg")`,
                }}
            />
        </div>
    );
}
