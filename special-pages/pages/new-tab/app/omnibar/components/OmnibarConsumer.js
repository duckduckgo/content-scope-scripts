import { Fragment, h } from 'preact';
import { useContext } from 'preact/hooks';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { useInitialSetupData, useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { Omnibar } from './Omnibar.js';
import styles from './Omnibar.module.css';
import { OmnibarContext } from './OmnibarProvider.js';
import { ArrowIndentCenteredIcon, LogoStacked } from '../../components/Icons.js';
import { useModeWithLocalPersistence } from './PersistentOmnibarValuesProvider.js';
import { useTabState } from '../../tabs/TabsProvider.js';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').OmnibarMode} Mode
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
    const { state, setEnableAi } = useContext(OmnibarContext);
    const { current } = useTabState();
    const { visibility } = useVisibility();
    const visible = visibility.value === 'visible';

    if (state.status !== 'ready') {
        return visible ? <OmnibarPlaceholder /> : null;
    }

    return (
        <>
            {state.config.showAiSetting && (
                <AiSetting enableAi={state.config?.enableAi === true} setEnableAi={setEnableAi} omnibarVisible={visible} />
            )}
            {visible && <OmnibarReadyState config={state.config} key={current.value} tabId={current.value} />}
        </>
    );
}

/**
 * Reserves the Omnibar's height until config arrives, using the subset sent in
 * `initialSetup` so nothing below it shifts. Falls back to the
 * tab switcher and the Duck.ai-sized spacer when native doesn't send it (e.g. Windows).
 */
function OmnibarPlaceholder() {
    const { omnibar } = useInitialSetupData();
    const showTabs = omnibar ? omnibar.showAiSetting && omnibar.enableAi : true;
    const mode = (showTabs && omnibar?.mode) || 'search';
    return (
        <div class={styles.root} data-mode={omnibar ? mode : undefined} aria-hidden="true">
            <LogoStacked class={styles.logo} />
            {showTabs && <div class={styles.placeholderTabs} />}
            <div class={styles.spacer} />
        </div>
    );
}

/**
 * @param {object} props
 * @param {OmnibarConfig} props.config
 * @param {string} props.tabId
 */
function OmnibarReadyState({ config, tabId }) {
    const {
        enableAi = true,
        showAiSetting = true,
        showCustomizePopover = false,
        enableRecentAiChats = false,
        showViewAllAiChats = false,
        enableVoiceChatAccess = false,
        enableAskAiSuggestion = true,
        enableAttachTabs = false,
        mode: defaultMode,
    } = config;
    const { setMode } = useContext(OmnibarContext);
    const modeForCurrentTab = useModeWithLocalPersistence(tabId, defaultMode);

    return (
        <Omnibar
            mode={modeForCurrentTab}
            setMode={setMode}
            enableAi={showAiSetting && enableAi}
            enableRecentAiChats={enableRecentAiChats}
            showViewAllAiChats={showViewAllAiChats}
            showCustomizePopover={showCustomizePopover}
            enableVoiceChatAccess={enableVoiceChatAccess}
            enableAskAiSuggestion={enableAskAiSuggestion}
            enableAttachTabs={enableAttachTabs}
            tabId={tabId}
        />
    );
}

/**
 * @param {object} props
 * @param {boolean} props.enableAi
 * @param {(enable: boolean) => void} props.setEnableAi
 * @param {boolean} props.omnibarVisible
 */
export function AiSetting({ enableAi, setEnableAi, omnibarVisible }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { id, index } = useVisibility();
    useCustomizer({
        title: t('omnibar_toggleDuckAi'),
        id: `_${id}-toggleAi`,
        icon: <ArrowIndentCenteredIcon style={{ color: 'var(--ds-color-theme-icons-tertiary)' }} />,
        toggle: () => setEnableAi(!enableAi),
        /**
         * Duck.ai is only ever shown as 'visible' (eg: switch is checked) if the omnibar is also visible.
         */
        visibility: omnibarVisible && enableAi ? 'visible' : 'hidden',
        index: index + 0.1,
        enabled: omnibarVisible,
    });
    return null;
}
