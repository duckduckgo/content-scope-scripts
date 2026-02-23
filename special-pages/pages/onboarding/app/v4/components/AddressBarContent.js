import { h } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';
import { useTypedTranslation } from '../../types';
import { GlobalDispatch, useGlobalState } from '../../global';
import { ToggleButton } from '../../shared/components/ToggleButton';
import { Launch } from '../../shared/components/Icons';

/**
 * Bottom bubble content for the addressBarMode step.
 * Shows a placeholder for gif, radio buttons for search mode, and Start Browsing button.
 */
export function AddressBarContent() {
    const { t } = useTypedTranslation();
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
        <div>
            {/* Placeholder for address bar animation/gif */}
            <div data-placeholder="address-bar-animation" style={{ minHeight: '100px', background: '#eee' }}>
                Address Bar Preview ({selectedOption})
            </div>

            <div>
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

            <div>
                <button type="button" onClick={dismiss}>
                    {t('startBrowsing')} <Launch />
                </button>
            </div>
        </div>
    );
}
