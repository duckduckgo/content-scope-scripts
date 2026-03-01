import { h } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';
import { useTypedTranslation } from '../../../types';
import { Trans } from '../../../../../../shared/components/TranslationsProvider';
import { useEnv } from '../../../../../../shared/components/EnvironmentProvider';
import { GlobalDispatch, useGlobalState } from '../../../global';
import { ToggleButton } from '../../../shared/components/ToggleButton';
import { AddressBarPreview } from './AddressBarPreview';
import { SlideIn } from '../../components/Animation';
import { Stack } from '../../../shared/components/Stack';
import styles from './AddressBarMode.module.css';

export function AddressBarMode() {
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

    return (
        <SlideIn>
            <Stack className={styles.container} gap={Stack.gaps['0']}>
                <Stack className={styles.body} gap="10px">
                    <AddressBarPreview isReduced={selectedOption === 'search-only'} isDarkMode={isDarkMode} />
                    <div className={styles.buttons}>
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
                </Stack>
                <div className={styles.footer}>
                    <img src="assets/img/steps/v3/Star-Color-24.svg" alt="" className={styles.starIcon} />
                    <span className={styles.footerText}>
                        <Trans str={t('addressBarMode_footer')} values={{}} />
                    </span>
                </div>
            </Stack>
        </SlideIn>
    );
}
