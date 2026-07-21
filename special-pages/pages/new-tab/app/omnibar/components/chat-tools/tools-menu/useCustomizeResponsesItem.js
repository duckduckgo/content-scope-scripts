import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { GlassesIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { Switch } from '../../../../../../../shared/components/Switch/Switch.js';
import { usePlatformName } from '../../../../settings.provider.js';
import { CustomizerThemesContext } from '../../../../customizer/CustomizerProvider.js';
import { useCustomizeResponses } from '../useCustomizeResponses';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./ToolsMenu').ToolConfig} ToolConfig
 * @typedef {import('./ToolsMenu').ToolId} ToolId
 */

/**
 * Builds the "Customize responses" Tools-menu row (config + on/off toggle) from
 * context, or `null` when config hides it. `isApplied` reports whether the stored
 * customization is currently on — used to collapse the Tools button.
 *
 * @param {object} params
 * @param {ToolId|null} params.activeTool - Currently active tool id, or null
 * @returns {{ item: ToolConfig|null, isApplied: boolean }}
 */
export function useCustomizeResponsesItem({ activeTool }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const platformName = usePlatformName();
    const { browser } = useContext(CustomizerThemesContext);
    const {
        showCustomizeResponses,
        customizeResponsesSubLabel,
        hasCustomization,
        customizeResponsesActive,
        onSetCustomizeResponsesActive,
        onOpenCustomizeResponses,
    } = useCustomizeResponses();

    const isApplied = hasCustomization && customizeResponsesActive;

    if (!showCustomizeResponses) return { item: null, isApplied };

    const disabled = activeTool === 'image-generation';
    /** @type {ToolConfig} */
    const item = {
        id: 'customize-responses',
        role: 'menuitem',
        icon: <GlassesIcon />,
        label: t('omnibar_customizeResponsesLabel'),
        description: customizeResponsesSubLabel || t('omnibar_customizeResponsesDescription'),
        disabled,
        trailingControl: hasCustomization ? (
            <Switch
                theme={browser?.value}
                platformName={platformName}
                size="small"
                checked={customizeResponsesActive}
                ariaLabel={t('omnibar_customizeResponsesToggleLabel')}
                pending={false}
                inputProps={{ disabled }}
                onChecked={() => onSetCustomizeResponsesActive?.(true)}
                onUnchecked={() => onSetCustomizeResponsesActive?.(false)}
            />
        ) : undefined,
        onSelect: () => onOpenCustomizeResponses?.(),
    };
    return { item, isApplied };
}
