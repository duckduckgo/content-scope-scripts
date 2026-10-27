import { Fragment, h } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { Omnibar } from './Omnibar.js';
import styles from './Omnibar.module.css';
import { OmnibarContext } from './OmnibarProvider.js';
import { ArrowIndentCenteredIcon, LogoStacked } from '../../components/Icons.js';
import { useModeWithLocalPersistence } from './PersistentOmnibarValuesProvider.js';
import { useTabState } from '../../tabs/TabsProvider.js';
import { TabSwitcher } from './TabSwitcher.js';

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

const LAYOUT_HINT_KEY = 'omnibar-layout-hint';

/**
 * The config arrives asynchronously, so the placeholder reuses the last-seen layout
 * to reserve the same space and avoid shifting the widgets below once it's ready.
 *
 * @returns {{ mode: Mode, enableAi: boolean }}
 */
function readLayoutHint() {
    try {
        const hint = JSON.parse(localStorage.getItem(LAYOUT_HINT_KEY) ?? 'null');
        if ((hint?.mode === 'search' || hint?.mode === 'ai') && typeof hint.enableAi === 'boolean') return hint;
    } catch {}
    return { mode: 'search', enableAi: true };
}

/**
 * @param {{ mode: Mode, enableAi: boolean }} hint
 */
function writeLayoutHint(hint) {
    try {
        localStorage.setItem(LAYOUT_HINT_KEY, JSON.stringify(hint));
    } catch {}
}

/**
 * @param {OmnibarConfig} config
 */
function isAiEnabled({ showAiSetting = true, enableAi = true }) {
    return showAiSetting && enableAi;
}

function OmnibarPlaceholder() {
    const [{ mode, enableAi }] = useState(readLayoutHint);
    return (
        <div class={styles.root} data-mode={mode} inert>
            <LogoStacked class={styles.logo} />
            {enableAi && (
                <div class={styles.tabSwitcherContainer}>
                    <TabSwitcher mode={mode} onChange={() => {}} />
                </div>
            )}
            <div class={styles.spacer}>
                <div class={`${styles.popup} ${styles.placeholderPopup}`} />
            </div>
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
    const enableAi = isAiEnabled(config);

    useEffect(() => {
        writeLayoutHint({ mode: defaultMode, enableAi });
    }, [defaultMode, enableAi]);

    return (
        <Omnibar
            mode={modeForCurrentTab}
            setMode={setMode}
            enableAi={enableAi}
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
