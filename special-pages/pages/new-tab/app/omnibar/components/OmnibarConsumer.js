import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { Omnibar } from './Omnibar.js';
import { OmnibarContext } from './OmnibarProvider.js';
import { ArrowIndentCenteredIcon } from '../../components/Icons.js';
import { useModeWithLocalPersistence } from './PersistentOmnibarValuesProvider.js';
import { useTabState } from '../../tabs/TabsProvider.js';

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
    const { current } = useTabState();
    if (state.status === 'ready') {
        return <OmnibarReadyState config={state.config} key={current.value} tabId={current.value} />;
    }
    return null;
}

/**
 * @param {object} props
 * @param {OmnibarConfig} props.config
 * @param {string} props.tabId
 */
function OmnibarReadyState({ config, tabId }) {
    const { enableAi = true, showAiSetting = true, mode: defaultMode } = config;
    const { setEnableAi, setMode } = useContext(OmnibarContext);
    const mode = useModeWithLocalPersistence(tabId, defaultMode);
    return (
        <>
            {showAiSetting && <AiSetting enableAi={enableAi} setEnableAi={setEnableAi} />}
            <Omnibar mode={mode} setMode={setMode} enableAi={showAiSetting && enableAi} tabId={tabId} />
        </>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.enableAi
 * @param {(enable: boolean) => void} props.setEnableAi
 */
function AiSetting({ enableAi, setEnableAi }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { id, index } = useVisibility();
    useCustomizer({
        title: t('omnibar_toggleDuckAi'),
        id: `_${id}-toggleAi`,
        icon: <ArrowIndentCenteredIcon style={{ color: 'var(--ntp-icons-tertiary)' }} />,
        toggle: () => setEnableAi(!enableAi),
        visibility: enableAi ? 'visible' : 'hidden',
        index: index + 0.1,
    });
    return null;
}
