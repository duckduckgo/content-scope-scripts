import { useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';
import { Fragment, h } from 'preact';
import { Omnibar } from './Omnibar.js';
import { AiChatIcon } from '../../components/Icons.js';
import { useTypedTranslationWith } from '../../types.js';
import { SettingsLink } from '../../customizer/components/SettingsLink.js';
import { Fill } from '../../customizer/components/SlotFill.js';

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
function OmnibarReadyState({ config: { enableAi = true, mode } }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    const { setMode, setEnableAi } = useContext(OmnibarContext);

    return (
        <Fragment>
            <Omnibar mode={mode} setMode={setMode} enableAi={enableAi} />
            <Fill name="SettingLinks" index={0} id={'duck-ai-toggle'}>
                <SettingsLink
                    title={enableAi ? t('omnibar_hideDuckAi') : t('omnibar_showDuckAi')}
                    icon={<AiChatIcon />}
                    onClick={() => {
                        setEnableAi(!enableAi);
                    }}
                />
            </Fill>
        </Fragment>
    );
}
