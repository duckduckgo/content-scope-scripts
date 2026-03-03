import { h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { GlobalDispatch } from '../../global';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import styles from './DockInstructionsContent.module.css';

const FRAME_DURATION = 2000;

const instructionFrames = [
    { src: 'assets/img/dock-instructions/step-1.png', srcSet: 'assets/img/dock-instructions/step-1@2x.png 2x' },
    { src: 'assets/img/dock-instructions/step-2.png', srcSet: 'assets/img/dock-instructions/step-2@2x.png 2x' },
    { src: 'assets/img/dock-instructions/step-3.png', srcSet: 'assets/img/dock-instructions/step-3@2x.png 2x' },
];

/**
 * Bottom bubble content for the dock-instructions overlay.
 * Shows a crossfading image slideshow with instruction text and a Next button.
 */
export function DockInstructionsContent() {
    const { t } = useTypedTranslation();
    const { isReducedMotion } = useEnv();
    const dispatch = useContext(GlobalDispatch);

    const [currentFrame, setCurrentFrame] = useState(0);
    const previousFrame = (currentFrame - 1 + instructionFrames.length) % instructionFrames.length;

    useEffect(() => {
        if (isReducedMotion) return;
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % instructionFrames.length);
        }, FRAME_DURATION);
        return () => clearInterval(interval);
    }, [isReducedMotion]);

    const handleNext = () => {
        dispatch({ kind: 'dismiss-overlay' });
        dispatch({ kind: 'update-system-value', id: 'dock-instructions', payload: { enabled: true }, current: true });
    };

    return (
        <div class={styles.root}>
            <div class={styles.imageContainer}>
                {instructionFrames.map((frame, i) => (
                    <img
                        key={i}
                        class={cn(styles.frame, {
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
            <div class={styles.instruction}>
                <img src="assets/img/steps/v4/dock.svg" alt="" class={styles.icon} />
                <p class={styles.instructionText}>
                    <Trans str={t('dockInstructions_body')} values={{}} />
                </p>
            </div>
            <Button variant="primary" size="stretch" onClick={handleNext}>
                {t('nextButton')}
            </Button>
        </div>
    );
}
