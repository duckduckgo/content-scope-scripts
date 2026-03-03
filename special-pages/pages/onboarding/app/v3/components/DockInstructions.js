import { h } from 'preact';
import { useEnv} from '../../../../../shared/components/EnvironmentProvider';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { useTypedTranslation } from '../../types';
import styles from './DockInstructions.module.css';

/**
 * Overlay content showing instructions for adding the app to the Dock.
 * Displayed when the user clicks "Show Me How" on the dock-instructions row.
 */
export function DockInstructions() {
    const { isReducedMotion } = useEnv();
    const { t } = useTypedTranslation();
    return (
        <div className={styles.root}>
            <video
                className={styles.video}
                src="assets/video/dock-instructions/add-to-dock.mp4"
                autoPlay={!isReducedMotion}
                loop
                muted
                playsinline
                width={384}
                height={188}
            />
            <div className={styles.instruction}>
                <img src="assets/img/steps/v3/Add-To-Dock-Color-24.svg" alt="" className={styles.icon} />
                <p className={styles.instructionText}>
                    <Trans str={t('dockInstructions_body')} values={{}} />
                </p>
            </div>
        </div>
    );
}
