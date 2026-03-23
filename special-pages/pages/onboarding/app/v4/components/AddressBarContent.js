import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useTypedTranslation } from '../../types';
import { Trans } from '../../../../../shared/components/TranslationsProvider';
import { useGlobalState } from '../../global';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { ToggleButton } from '../../shared/components/ToggleButton';
import { AddressBarPreview } from './AddressBarPreview';
import { Button } from './Button';
import { Container } from './Container';
import { Launch } from '../../shared/components/Icons';
import styles from './AddressBarContent.module.css';

/** @typedef {'search-and-duckai' | 'search-only'} AddressBarOption */

/**
 * Bottom bubble content for the addressBarMode step.
 * Shows the address bar preview animation, radio toggle buttons for search mode,
 * a footer note about AI features, and the Start Browsing button.
 *
 * @param {object} props
 * @param {() => void} props.dismiss
 * @param {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} props.updateSystemValue
 */
export function AddressBarContent({ dismiss, updateSystemValue }) {
    const { t } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const { status } = useGlobalState();

    const [selectedOption, setSelectedOption] = useState(/** @type {AddressBarOption} */ ('search-and-duckai'));
    const isPending = status.kind === 'executing';

    /** @param {AddressBarOption} option */
    const select = (option) => {
        if (option === selectedOption || isPending) return;
        setSelectedOption(option);
        updateSystemValue('address-bar-mode', { enabled: option === 'search-and-duckai' }, true);
    };

    return (
        <Container class={styles.root}>
            <div class={styles.previewContainer}>
                <AddressBarPreview isReduced={selectedOption === 'search-only'} isDarkMode={isDarkMode} />
            </div>
            <div class={styles.toggleButtons}>
                <ToggleButton
                    label={t('addressBarMode_searchAndDuckAi')}
                    selected={selectedOption === 'search-and-duckai'}
                    onClick={() => select('search-and-duckai')}
                />
                <ToggleButton
                    label={t('addressBarMode_searchOnly')}
                    selected={selectedOption === 'search-only'}
                    onClick={() => select('search-only')}
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
        </Container>
    );
}
