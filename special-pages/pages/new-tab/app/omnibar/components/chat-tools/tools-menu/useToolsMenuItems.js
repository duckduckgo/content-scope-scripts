import { h } from 'preact';
import { CreateImageIcon, GlobeIcon } from '../../../../components/Icons';
import { useTypedTranslationWith } from '../../../../types';
import { useCustomizeResponsesItem } from './useCustomizeResponsesItem';

/**
 * @typedef {typeof import('../../../strings.json')} Strings
 * @typedef {import('./ToolsMenu').ToolConfig} ToolConfig
 * @typedef {import('./ToolsMenu').ToolId} ToolId
 */

/**
 * Builds the Tools-menu view model from all menu sources (tools + "Customize
 * responses"), so {@link import('./ToolsMenu').ToolsMenu} only has to render.
 * Combining the sources here keeps the data flow explicit: `items` is the
 * complete, ordered menu, `activeItem` backs the collapsed chip, and
 * `isCollapsed` drives the trigger's icon-only state.
 *
 * @param {object} params
 * @param {ToolId[]} params.tools - IDs of available tools to show in the menu
 * @param {ToolId|null} params.activeTool - Currently active tool id, or null
 * @param {(toolId: ToolId) => void} params.onToggle - Toggle a tool by id
 * @returns {{ items: ToolConfig[], activeItem: ToolConfig|null, isCollapsed: boolean }}
 */
export function useToolsMenuItems({ tools, activeTool, onToggle }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const customizeResponses = useCustomizeResponsesItem({ activeTool });

    /** @param {ToolId} id @returns {ToolConfig|null} */
    const getToolConfig = (id) => {
        switch (id) {
            case 'image-generation':
                return {
                    id,
                    role: 'menuitemcheckbox',
                    icon: <CreateImageIcon />,
                    label: t('omnibar_createImageLabel'),
                    description: t('omnibar_createImageDescription'),
                    selected: activeTool === id,
                    onSelect: () => onToggle(id),
                };
            case 'web-search':
                return {
                    id,
                    role: 'menuitemcheckbox',
                    icon: <GlobeIcon />,
                    label: t('omnibar_webSearchLabel'),
                    description: t('omnibar_webSearchDescription'),
                    selected: activeTool === id,
                    onSelect: () => onToggle(id),
                };
            case 'customize-responses':
                return customizeResponses.item;
            default: {
                /**
                 * Exhaustiveness check — `never` means all ToolId cases are handled;
                 * adding a new one without a case will cause a type error here.
                 * @type {never}
                 */
                const _exhaustiveCheck = id;
                console.error(`Unknown tool id: ${_exhaustiveCheck}`);
                return null;
            }
        }
    };

    const toolItems = /** @type {ToolConfig[]} */ (tools.map(getToolConfig).filter(Boolean));

    /** @type {ToolConfig[]} */
    const items = [...toolItems];
    if (customizeResponses.item) {
        // Divider only when tool rows sit above the "Customize responses" row.
        items.push({ ...customizeResponses.item, separatorBefore: toolItems.length > 0 });
    }

    const activeItem = activeTool ? (getToolConfig(activeTool) ?? null) : null;
    const isCollapsed = Boolean(activeItem) || customizeResponses.isApplied;

    return { items, activeItem, isCollapsed };
}
