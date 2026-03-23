import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import cn from 'classnames';
import { GlobalContext } from '../../global';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import styles from './Background.module.css';
import { DaxBobbingAnimation } from './DaxBobbingAnimation';

/**
 * Maps each step to its background image filename (without extension/variant suffix).
 * Multiple steps can share the same background.
 * @type {Record<import('../../types').Step['id'], string>}
 */
const backgroundForStep = {
    welcome: 'background-01',
    getStarted: 'background-01',
    makeDefaultSingle: 'background-01',
    systemSettings: 'background-02',
    duckPlayerSingle: 'background-02',
    customize: 'background-03',
    addressBarMode: 'background-04',
};

/**
 * @param {object} props
 * @param {string} props.filename - background filename stem, e.g. 'background-02'
 * @param {string} props.class
 * @param {boolean} [props.rightAligned]
 * @param {(() => void)} [props.onAnimationEnd]
 */
function Illustration({ filename, class: className, rightAligned, onAnimationEnd }) {
    return (
        <picture class={cn(className, rightAligned && styles.rightAligned)} onAnimationEnd={onAnimationEnd}>
            <source srcset={`assets/img/v4/${filename}-dark.svg`} media="(prefers-color-scheme: dark)" />
            <img src={`assets/img/v4/${filename}-light.svg`} alt="" />
        </picture>
    );
}

/**
 * Step-specific background for v4 onboarding.
 * The background illustration slides in from the bottom on transition;
 * when consecutive steps share the same background, no animation plays.
 */
export function Background() {
    const { activeStep } = useContext(GlobalContext);
    const { isReducedMotion } = useEnv();
    const filename = backgroundForStep[activeStep];

    const [prevFilename, setPrevFilename] = useState(filename);
    const [exitingFilename, setExitingFilename] = useState(/** @type {string | null} */ (null));

    if (prevFilename !== filename) {
        // When reduced motion is on, no animation plays so animationend never
        // fires. Skip the exit state entirely to avoid stale backgrounds.
        setExitingFilename(isReducedMotion ? null : prevFilename);
        setPrevFilename(filename);
    }

    return (
        <div class={styles.background}>
            {exitingFilename && (
                <Illustration
                    key={exitingFilename}
                    filename={exitingFilename}
                    rightAligned={exitingFilename === 'background-04'}
                    class={cn(styles.illustration, styles.slideOut)}
                    onAnimationEnd={() => setExitingFilename(null)}
                />
            )}
            <Illustration
                key={filename}
                filename={filename}
                rightAligned={filename === 'background-04'}
                class={cn(styles.illustration, styles.slideIn)}
            />
            {(filename === 'background-03' || exitingFilename === 'background-03') && (
                <DaxBobbingAnimation exiting={exitingFilename === 'background-03'} />
            )}
        </div>
    );
}
