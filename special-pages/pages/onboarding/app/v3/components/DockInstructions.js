import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { useTypedTranslation } from '../../types';
import styles from './DockInstructions.module.css';

const FRAME_DURATION = 2000;

const instructionFrames = [
    { src: 'assets/img/dock-instructions/step-1.png', srcSet: 'assets/img/dock-instructions/step-1@2x.png 2x' },
    { src: 'assets/img/dock-instructions/step-2.png', srcSet: 'assets/img/dock-instructions/step-2@2x.png 2x' },
    { src: 'assets/img/dock-instructions/step-3.png', srcSet: 'assets/img/dock-instructions/step-3@2x.png 2x' },
];

/**
 * Overlay content showing instructions for adding the app to the Dock.
 * Displayed when the user clicks "Show Me How" on the dock-instructions row.
 */
export function DockInstructions() {
    const [currentFrame, setCurrentFrame] = useState(0);
    const previousFrame = (currentFrame - 1 + instructionFrames.length) % instructionFrames.length;
    const { isReducedMotion } = useEnv();
    const { t } = useTypedTranslation();

    useEffect(() => {
        if (isReducedMotion) return;
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % instructionFrames.length);
        }, FRAME_DURATION);
        return () => clearInterval(interval);
    }, [isReducedMotion]);

    return (
        <div className={styles.root}>
            <div className={styles.imageContainer}>
                {instructionFrames.map((frame, i) => (
                    <img
                        key={i}
                        className={cn(styles.frame, {
                            [styles.active]: i === currentFrame,
                            [styles.previous]: i === previousFrame,
                        })}
                        src={frame.src}
                        srcSet={frame.srcSet}
                        alt=""
                        width={384}
                        height={188}
                    />
                ))}
            </div>
            <div className={styles.instruction}>
                <img src="assets/img/steps/v3/Add-To-Dock-Color-24.svg" alt="" className={styles.icon} />
                <p className={styles.instructionText}>
                    <Trans str={t('dockInstructions_body')} values={{}} />
                </p>
            </div>
        </div>
    );
}
