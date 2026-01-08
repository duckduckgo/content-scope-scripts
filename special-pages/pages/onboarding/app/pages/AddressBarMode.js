import { h } from 'preact';
import { useState, useContext } from 'preact/hooks';
import { useEnv } from '../../../../shared/components/EnvironmentProvider';
import { useTypedTranslation } from '../types';
import { Trans } from '../../../../shared/components/TranslationsProvider';
import { GlobalDispatch } from '../global';
import { ToggleButton } from '../components/ToggleButton';
import { SlideIn } from '../components/v3/Animation';
import { Stack } from '../components/Stack';
import styles from './AddressBarMode.module.css';

export function AddressBarMode() {
    const { isDarkMode } = useEnv();
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);
    const [selectedOption, setSelectedOption] = useState('search-and-duckai');

    const handleSelection = (option) => {
        setSelectedOption(option);
        dispatch({
            kind: 'update-system-value',
            id: 'address-bar-mode',
            payload: { enabled: selectedOption === 'search-and-duckai' },
            current: true,
        });
    };

    const getImagePath = () => {
        const images = {
            'search-and-duckai': {
                light: 'assets/img/steps/v3/addressBarMode/Toggle-AI.svg',
                dark: 'assets/img/steps/v3/addressBarMode/Toggle-AI-Dark.svg',
            },
            'search-only': {
                light: 'assets/img/steps/v3/addressBarMode/Toggle-Search.svg',
                dark: 'assets/img/steps/v3/addressBarMode/Toggle-Search-Dark.svg',
            },
        };
        return isDarkMode ? images[selectedOption].dark : images[selectedOption].light;
    };

    return (
        <SlideIn>
            <Stack className={styles.container} gap={Stack.gaps['0']}>
                <Stack className={styles.body} gap="10px">
                    <img src={getImagePath()} alt="Duck.ai Address Bar Mode Toggle" className={styles.image} />
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
