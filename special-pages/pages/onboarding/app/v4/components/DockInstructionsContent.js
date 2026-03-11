import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import styles from './DockInstructionsContent.module.css';

/**
 * Bottom bubble content for the dock-instructions overlay.
 * Shows a looping video with instruction text and a Next button.
 */
export function DockInstructionsContent() {
    const { t } = useTypedTranslation();
    const { isReducedMotion } = useEnv();
    const dispatch = useContext(GlobalDispatch);
    const handleNext = () => {
        dispatch({ kind: 'dismiss-overlay' });
        dispatch({ kind: 'update-system-value', id: 'dock-instructions', payload: { enabled: true }, current: true });
    };

    return (
        <div class={styles.root}>
            <video
                class={styles.video}
                src="assets/video/dock-instructions/add-to-dock.mp4"
                autoPlay={!isReducedMotion}
                loop
                muted
                playsinline
                width={384}
                height={188}
            />
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
