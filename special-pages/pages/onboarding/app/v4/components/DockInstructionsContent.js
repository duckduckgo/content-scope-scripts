import { h } from 'preact';
import { useGlobalDispatch } from '../../global';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { useTypedTranslation } from '../../types';
import { Button } from './Button';
import { Container } from './Container';
import styles from './DockInstructionsContent.module.css';

/**
 * Bottom bubble content for the dock-instructions overlay.
 * Shows a looping video with instruction text and a Next button.
 *
 * @param {object} props
 * @param {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} props.updateSystemValue
 */
export function DockInstructionsContent({ updateSystemValue }) {
    const { t } = useTypedTranslation();
    const { isReducedMotion } = useEnv();
    const dispatch = useGlobalDispatch();

    const next = () => {
        dispatch({ kind: 'dismiss-overlay' });
        updateSystemValue('dock-instructions', { enabled: true }, true);
    };

    return (
        <Container>
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
            <Button variant="primary" size="stretch" onClick={next}>
                {t('nextButton')}
            </Button>
        </Container>
    );
}
