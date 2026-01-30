import { Fragment, h } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { useMessaging, useTypedTranslationWith } from '../../types.js';
import { useVisibility, useWidgetId } from '../../widget-list/widget-config.provider.js';
import { Omnibar } from './Omnibar.js';
import { OmnibarContext } from './OmnibarProvider.js';
import { ArrowIndentCenteredIcon } from '../../components/Icons.js';
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
    const messaging = useMessaging();
    const { widgetId } = useWidgetId();
    const didNotifyRef = useRef(false);

    // Notify native when omnibar widget is ready
    useEffect(() => {
        if (state.status === 'ready' && !didNotifyRef.current) {
            didNotifyRef.current = true;
            requestAnimationFrame(() => {
                messaging.widgetDidRender({ id: widgetId });
            });
        }
    }, [state.status, messaging, widgetId]);

    if (state.status !== 'ready') return null;

    const visible = visibility.value === 'visible';
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
 * @param {object} props
 * @param {OmnibarConfig} props.config
 * @param {string} props.tabId
 */
function OmnibarReadyState({ config, tabId }) {
    const { enableAi = true, showAiSetting = true, showCustomizePopover = false, mode: defaultMode } = config;
    const { setMode } = useContext(OmnibarContext);
    const modeForCurrentTab = useModeWithLocalPersistence(tabId, defaultMode);

    return (
        <Omnibar
            mode={modeForCurrentTab}
            setMode={setMode}
            enableAi={showAiSetting && enableAi}
            showCustomizePopover={showCustomizePopover}
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
