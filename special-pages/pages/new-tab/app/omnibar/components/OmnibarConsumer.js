import { useContext, useEffect } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';
import { h } from 'preact';
import { Omnibar } from './Omnibar.js';
import { CustomizerContext } from '../../customizer/CustomizerProvider.js';
import { AiChatIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 */

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <OmnibarProvider>
 *   <OmnibarConsumer />
 * </OmnibarProvider>
 * ```
 */
export function OmnibarConsumer() {
    const { state } = useContext(OmnibarContext);
    if (state.status === 'ready') {
        return <OmnibarReadyState config={state.config} />;
    }
    return null;
}

/**
 * @param {object} props
 * @param {OmnibarConfig} props.config
 */
function OmnibarReadyState({ config: { enableAi = true, showAiSetting = true, mode } }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const { settingsLinks } = useContext(CustomizerContext);
    const { setMode, setEnableAi } = useContext(OmnibarContext);

    useEffect(() => {
        if (showAiSetting) {
            settingsLinks.value = {
                ...settingsLinks.value,
                duckAi: {
                    title: enableAi ? t('omnibar_hideDuckAi') : t('omnibar_showDuckAi'),
                    icon: <AiChatIcon />,
                    onClick: () => setEnableAi(!enableAi),
                },
            };
        }
        return () => {
            const { duckAi: _, ...rest } = settingsLinks.value;
            settingsLinks.value = rest;
        };
    }, [enableAi, showAiSetting]);

    return <Omnibar mode={mode} setMode={setMode} enableAi={enableAi} />;
}
