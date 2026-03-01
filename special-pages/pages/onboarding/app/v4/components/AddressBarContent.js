import { h } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';
import { useTypedTranslation } from '../../types';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { GlobalDispatch, useGlobalState } from '../../global';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { ToggleButton } from '../../shared/components/ToggleButton';
import { AddressBarPreview } from './AddressBarPreview';
import { Button } from './Button';
import { Launch } from '../../shared/components/Icons';
import styles from './AddressBarContent.module.css';

/**
 * Bottom bubble content for the addressBarMode step.
 * Shows the address bar preview animation, radio toggle buttons for search mode,
 * a footer note about AI features, and the Start Browsing button.
 */
export function AddressBarContent() {
    const { t } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const dispatch = useContext(GlobalDispatch);
    const { status } = useGlobalState();
    const [selectedOption, setSelectedOption] = useState('search-and-duckai');
    const isPending = status.kind === 'executing';

    const dispatchPreference = (option) => {
        dispatch({
            kind: 'update-system-value',
            id: 'address-bar-mode',
            payload: { enabled: option === 'search-and-duckai' },
            current: true,
        });
    };

    useEffect(() => {
        dispatchPreference(selectedOption);
    }, []);

    const handleSelection = (option) => {
        if (option === selectedOption || isPending) return;
        setSelectedOption(option);
        dispatchPreference(option);
    };

    const dismiss = () => dispatch({ kind: 'dismiss' });

    return (
        <div class={styles.root}>
            <div class={styles.previewContainer}>
                <AddressBarPreview isReduced={selectedOption === 'search-only'} isDarkMode={isDarkMode} />
            </div>
            <div class={styles.toggleButtons}>
                <ToggleButton
                    label={t('addressBarMode_searchAndDuckAi')}
                    selected={selectedOption === 'search-and-duckai'}
                    onClick={() => handleSelection('search-and-duckai')}
                />
                <ToggleButton
                    label={t('addressBarMode_searchOnly')}
                    selected={selectedOption === 'search-only'}
                    onClick={() => handleSelection('search-only')}
                />
            </div>
            <div class={styles.footer}>
                <img src="assets/img/steps/v4/ai-chat.svg" alt="" class={styles.starIcon} />
                <span class={styles.footerText}>
                    <Trans str={t('addressBarMode_footer')} values={{}} />
                </span>
            </div>
            <Button variant="primary" size="wide" class={styles.startButton} onClick={dismiss}>
                {t('startBrowsing')} <Launch />
            </Button>
        </div>
    );
}
