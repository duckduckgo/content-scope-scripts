import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { useBeforeAfter } from '../context/BeforeAfterProvider';
import { Replay } from '../../shared/components/Icons';

/**
 * Bottom bubble content for the duckPlayerSingle step.
 * Shows a placeholder for the gif/animation, a before/after toggle, and a Next button.
 */
export function DuckPlayerContent() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);
    const { getStep, setStep } = useBeforeAfter();

    const beforeAfterState = getStep('duckPlayerSingle');

    const advance = () => dispatch({ kind: 'advance' });

    const longestText = [t('beforeAfter_duckPlayer_show'), t('beforeAfter_duckPlayer_hide')].reduce((acc, cur) => {
        return cur.length > acc.length ? cur : acc;
    });

    return (
        <div>
            {/* Placeholder for Duck Player animation/gif */}
            <div data-placeholder="duck-player-animation" style={{ minHeight: '200px', background: '#eee' }}>
                Duck Player Preview ({beforeAfterState || 'before'})
            </div>

            <div>
                <button
                    type="button"
                    aria-label={longestText}
                    onClick={() => setStep('duckPlayerSingle', beforeAfterState === 'after' ? 'before' : 'after')}
                >
                    <Replay direction={beforeAfterState === 'after' ? 'backward' : 'forward'} />
                    {beforeAfterState === 'after' ? t('beforeAfter_duckPlayer_hide') : t('beforeAfter_duckPlayer_show')}
                </button>
                <button type="button" onClick={advance}>
                    {t('nextButton')}
                </button>
            </div>
        </div>
    );
}
