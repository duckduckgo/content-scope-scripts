import { h } from 'preact';
import { useContext, useState, useRef, useCallback, useEffect } from 'preact/hooks';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';
import { isMultiInstanceWidget } from '../../widget-list/widget-config.service.js';
import { WidgetRow } from './WidgetRow.js';
import { AddWidgetMenu } from './AddWidgetMenu.js';
import { useTypedTranslationWith } from '../../types.js';
import styles from './WidgetsSection.module.css';

/**
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs} WidgetConfigs
 * @typedef {WidgetConfigs[number]} WidgetConfigItem
 * @typedef {'weather' | 'news' | 'stock'} MultiInstanceWidgetType
 */

/**
 * Get display title for a widget config
 * @param {WidgetConfigItem} config
 * @param {(key: string) => string} t - translation function
 * @returns {string}
 */
function getWidgetTitle(config, t) {
    // For non-multi-instance widgets, use translations
    if (!isMultiInstanceWidget(config.id)) {
        switch (config.id) {
            case 'omnibar':
                return t('omnibar_menuTitle');
            case 'favorites':
                return t('favorites_menu_title');
            case 'protections':
                return t('protections_menuTitle');
            default:
                return config.id.charAt(0).toUpperCase() + config.id.slice(1);
        }
    }

    // For multi-instance widgets, use capitalized name with optional config detail
    const baseTitle = config.id.charAt(0).toUpperCase() + config.id.slice(1);

    if (config.id === 'weather' && 'location' in config && config.location) {
        return `${baseTitle} - ${config.location}`;
    }
    if (config.id === 'news' && 'query' in config && config.query) {
        return `${baseTitle} - ${config.query}`;
    }
    if (config.id === 'stock' && 'symbol' in config && config.symbol) {
        return `${baseTitle} - ${config.symbol}`;
    }

    return baseTitle;
}

export function WidgetsSection() {
    const { currentValues, toggle, addInstance, removeInstance, reorderWidgets } = useContext(WidgetConfigContext);
    const { t } = useTypedTranslationWith(/** @type {Record<string, string>} */ ({}));

    // Drag state
    const [dragState, setDragState] = useState(/** @type {{ index: number, startY: number, currentY: number } | null} */ (null));
    const listRef = useRef(/** @type {HTMLUListElement | null} */ (null));
    const rowRefs = useRef(/** @type {Map<number, HTMLLIElement>} */ (new Map()));

    /**
     * @param {number} index
     * @param {number} clientY
     */
    const handleDragStart = useCallback((index, clientY) => {
        setDragState({ index, startY: clientY, currentY: clientY });
    }, []);

    /**
     * @param {number} clientY
     */
    const handleDragMove = useCallback(
        (clientY) => {
            if (dragState === null) return;

            setDragState((prev) => (prev ? { ...prev, currentY: clientY } : null));

            // Check if we need to reorder
            const items = currentValues.value;
            const draggedIndex = dragState.index;
            const rowHeight = rowRefs.current.get(draggedIndex)?.offsetHeight || 40;
            const deltaY = clientY - dragState.startY;
            const indexDelta = Math.round(deltaY / rowHeight);
            const newIndex = Math.max(0, Math.min(items.length - 1, draggedIndex + indexDelta));

            if (newIndex !== draggedIndex) {
                const newItems = [...items];
                const [draggedItem] = newItems.splice(draggedIndex, 1);
                newItems.splice(newIndex, 0, draggedItem);
                reorderWidgets(newItems);

                // Adjust startY to account for the item's new natural position
                // Moving down: natural position increases, so increase startY
                // Moving up: natural position decreases, so decrease startY
                const direction = newIndex > draggedIndex ? 1 : -1;
                const adjustment = direction * rowHeight;
                setDragState((prev) => (prev ? { ...prev, index: newIndex, startY: prev.startY + adjustment } : null));
            }
        },
        [dragState, currentValues.value, reorderWidgets],
    );

    const handleDragEnd = useCallback(() => {
        setDragState(null);
    }, []);

    // Global pointer move/up handlers
    useEffect(() => {
        if (dragState === null) return;

        const handlePointerMove = (/** @type {PointerEvent} */ e) => {
            e.preventDefault();
            handleDragMove(e.clientY);
        };

        const handlePointerUp = () => {
            handleDragEnd();
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('pointercancel', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [dragState, handleDragMove, handleDragEnd]);

    /**
     * @param {WidgetConfigItem} config
     */
    const handleToggle = (config) => {
        const instanceId = 'instanceId' in config ? config.instanceId : undefined;
        toggle(config.id, instanceId);
    };

    /**
     * @param {WidgetConfigItem} config
     */
    const handleRemove = (config) => {
        if ('instanceId' in config && config.instanceId) {
            removeInstance(config.instanceId);
        }
    };

    /**
     * @param {MultiInstanceWidgetType} widgetType
     */
    const handleAddWidget = (widgetType) => {
        addInstance(widgetType);
    };

    // Calculate transform for dragged item
    const getDragTransform = (/** @type {number} */ index) => {
        if (dragState === null || dragState.index !== index) return undefined;
        const deltaY = dragState.currentY - dragState.startY;
        return `translateY(${deltaY}px)`;
    };

    return (
        <div className={styles.widgetsSection}>
            <div className={styles.header}>
                <span className={styles.title}>Widgets</span>
                <AddWidgetMenu onAdd={handleAddWidget} />
            </div>
            <ul className={styles.list} ref={listRef}>
                {currentValues.value.map((config, index) => {
                    const key = 'instanceId' in config && config.instanceId ? config.instanceId : config.id;
                    const isDragging = dragState !== null && dragState.index === index;
                    return (
                        <WidgetRow
                            key={key}
                            config={config}
                            title={getWidgetTitle(config, t)}
                            isDragging={isDragging}
                            dragTransform={getDragTransform(index)}
                            onToggle={() => handleToggle(config)}
                            onRemove={() => handleRemove(config)}
                            onDragStart={(clientY) => handleDragStart(index, clientY)}
                            rowRef={(el) => {
                                if (el) {
                                    rowRefs.current.set(index, el);
                                } else {
                                    rowRefs.current.delete(index);
                                }
                            }}
                        />
                    );
                })}
            </ul>
        </div>
    );
}
