import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import styles from './App.module.css';
import { useTypedTranslation } from '../types.js';
import { Trans } from '../../../../shared/components/TranslationsProvider.js';
import { Arrow } from './Arrow.jsx';

export function App() {
    const { t } = useTypedTranslation();
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const arrowX = params.get('arrow_x');
    const arrowY = params.get('arrow_y');

    /** @type {Record<string, string>} */
    const arrowStyle = {};
    if (arrowX) arrowStyle.left = `${arrowX}px`;
    if (arrowY) arrowStyle.top = `${arrowY}px`;

    return (
        <main class={styles.layout}>
            <div class={styles.overlay}>
                <div class={styles.instructionsWrapper}>
                    <div class={styles.instructionsBar}>
                        <p class={styles.instructionsText}>
                            <Trans str={t('setDefaultInstruction')} values={{}} />
                        </p>
                    </div>
                    <div class={styles.arrow} style={Object.keys(arrowStyle).length > 0 ? arrowStyle : undefined}>
                        <Arrow />
                    </div>
                </div>
            </div>
        </main>
    );
}
