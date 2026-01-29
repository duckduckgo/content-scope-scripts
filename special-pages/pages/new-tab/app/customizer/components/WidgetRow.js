import { h } from 'preact';
import { useContext } from 'preact/hooks';
import cn from 'classnames';
import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { usePlatformName } from '../../settings.provider.js';
import { CustomizerThemesContext } from '../CustomizerProvider.js';
import { isMultiInstanceWidget } from '../../widget-list/widget-config.service.js';
import styles from './WidgetsSection.module.css';

/**
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs} WidgetConfigs
 * @typedef {WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Drag handle icon component
 * @param {object} props
 * @param {(clientY: number) => void} props.onDragStart
 */
function DragHandle({ onDragStart }) {
    return (
        <div
            className={styles.dragHandle}
            onPointerDown={(e) => {
                e.preventDefault();
                // Capture pointer to receive events even when moving outside
                /** @type {HTMLElement} */ (e.currentTarget).setPointerCapture(e.pointerId);
                onDragStart(e.clientY);
            }}
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="4" r="1.5" />
                <circle cx="11" cy="4" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="11" cy="12" r="1.5" />
            </svg>
        </div>
    );
}

/**
 * Remove button (X) icon component
 * @param {object} props
 * @param {() => void} props.onClick
 */
function RemoveButton({ onClick }) {
    return (
        <button className={styles.removeButton} onClick={onClick} aria-label="Remove widget" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
        </button>
    );
}

/**
 * Widget icon component
 * @param {object} props
 * @param {string} props.id
 */
function WidgetIcon({ id }) {
    // Simple icon based on widget type
    const icons = {
        weather: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 1zm3.182 1.318a.5.5 0 0 1 .707 0l.707.707a.5.5 0 0 1-.707.707l-.707-.707a.5.5 0 0 1 0-.707zM1 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1 1 8zm11.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
        ),
        news: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5v-11zM12 14c.37 0 .654-.211.853-.441.092-.106.147-.279.147-.531V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v11c0 .278.223.5.497.5H12z" />
            </svg>
        ),
        stock: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 0h1v15h15v1H0V0zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5z" />
            </svg>
        ),
        omnibar: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
        ),
        favorites: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73z" />
            </svg>
        ),
        protections: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524z" />
            </svg>
        ),
    };

    return <span className={styles.icon}>{icons[id] || icons.favorites}</span>;
}

/**
 * @param {object} props
 * @param {WidgetConfigItem} props.config
 * @param {string} props.title
 * @param {boolean} props.isDragging
 * @param {string} [props.dragTransform]
 * @param {() => void} props.onToggle
 * @param {() => void} props.onRemove
 * @param {(clientY: number) => void} props.onDragStart
 * @param {(el: HTMLLIElement | null) => void} props.rowRef
 */
export function WidgetRow({ config, title, isDragging, dragTransform, onToggle, onRemove, onDragStart, rowRef }) {
    const platformName = usePlatformName();
    const { browser } = useContext(CustomizerThemesContext);
    const isMulti = isMultiInstanceWidget(config.id);

    return (
        <li
            ref={rowRef}
            className={cn(styles.row, { [styles.dragging]: isDragging })}
            style={dragTransform ? { transform: dragTransform, zIndex: 10 } : undefined}
        >
            <DragHandle onDragStart={onDragStart} />
            <WidgetIcon id={config.id} />
            <span className={styles.rowTitle}>{title}</span>
            {isMulti ? (
                <RemoveButton onClick={onRemove} />
            ) : (
                <Switch
                    theme={browser.value}
                    platformName={platformName}
                    checked={config.visibility === 'visible'}
                    size="medium"
                    onChecked={onToggle}
                    onUnchecked={onToggle}
                    ariaLabel={`Toggle ${title}`}
                    pending={false}
                />
            )}
        </li>
    );
}
