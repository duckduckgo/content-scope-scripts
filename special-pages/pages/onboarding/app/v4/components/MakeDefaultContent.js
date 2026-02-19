import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalContext, GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { ComparisonTable } from './ComparisonTable';
import { Button } from './Button';
import styles from './MakeDefaultContent.module.css';

/**
 * Top bubble content for the makeDefaultSingle step.
 * Shows title (changes after user makes default), comparison table, and Skip/Make Default buttons.
 */
export function MakeDefaultContent() {
    const { t } = useTypedTranslation();
    const globalState = useContext(GlobalContext);
    const dispatch = useContext(GlobalDispatch);
    const { UIValues } = globalState;
    const isIdle = UIValues['default-browser'] === 'idle';

    const advance = () => dispatch({ kind: 'advance' });

    const enableDefaultBrowser = () =>
        dispatch({
            kind: 'update-system-value',
            id: 'default-browser',
            payload: { enabled: true },
            current: true,
        });

    return (
        <div class={styles.root}>
            <h2 class={styles.title}>{isIdle ? t('protectionsActivated_title') : t('makeDefaultAccept_title_v4')}</h2>

            <ComparisonTable />

            <div class={styles.actions}>
                {isIdle && (
                    <Button variant="secondary" class={styles.skipButton} onClick={advance}>
                        {t('skipButton')}
                    </Button>
                )}
                <Button size={isIdle ? undefined : 'wide'} onClick={isIdle ? enableDefaultBrowser : advance}>
                    {isIdle ? t('makeDefaultButton') : t('nextButton')}
                </Button>
            </div>
        </div>
    );
}
