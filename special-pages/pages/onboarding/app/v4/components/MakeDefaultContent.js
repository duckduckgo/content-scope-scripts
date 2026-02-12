import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalContext, GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { ComparisonTable } from './ComparisonTable';

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
        <div>
            <h2>{isIdle ? t('protectionsActivated_title') : t('makeDefaultAccept_title')}</h2>

            <ComparisonTable />

            <div>
                {isIdle && (
                    <button type="button" onClick={advance}>
                        {t('skipButton')}
                    </button>
                )}
                <button type="button" onClick={isIdle ? enableDefaultBrowser : advance}>
                    {isIdle ? t('makeDefaultButton') : t('nextButton')}
                </button>
            </div>
        </div>
    );
}
