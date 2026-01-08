import { h } from 'preact';
import { useState, useContext } from 'preact/hooks';
import { useTypedTranslation } from '../types';
import { Trans } from '../../../../shared/components/TranslationsProvider';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';
import { GlobalDispatch } from '../global';
import { ToggleButton } from '../components/ToggleButton';
import { AddressBarPreview } from '../components/AddressBarPreview';
import { SlideIn } from '../components/v3/Animation';
import { Stack } from '../components/Stack';
import styles from './AddressBarMode.module.css';

export function AddressBarMode() {
    const { t } = useTypedTranslation();
    const { isDarkMode } = useEnv();
    const dispatch = useContext(GlobalDispatch);
    const [selectedOption, setSelectedOption] = useState('search-and-duckai');

    const handleSelection = (option) => {
        setSelectedOption(option);
        dispatch({
            kind: 'update-system-value',
            id: 'address-bar-mode',
            payload: { enabled: option === 'search-and-duckai' },
            current: true,
        });
    };

    const isReduced = selectedOption === 'search-only';

    return (
        <SlideIn>
            <Stack className={styles.container} gap={Stack.gaps['0']}>
                <Stack className={styles.body} gap="10px">
                    <AddressBarPreview isReduced={isReduced} isDarkMode={isDarkMode} />
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
