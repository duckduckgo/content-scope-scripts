import { h } from 'preact';
import { MULTI_INSTANCE_WIDGETS } from '../../widget-list/widget-config.service.js';
import { Dropdown, DropdownItem } from '../../components/Dropdown.js';
import styles from './WidgetsSection.module.css';

const widgetIcons = {
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
};

/**
 * @param {object} props
 * @param {(widgetType: typeof MULTI_INSTANCE_WIDGETS[number]) => void} props.onAdd
 */
export function AddWidgetMenu({ onAdd }) {
    const widgetLabels = {
        weather: 'Weather',
        news: 'News',
        stock: 'Stock',
    };

    const trigger = (
        <button className={styles.addButton} aria-haspopup="true" aria-label="Add widget" type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
        </button>
    );

    return (
        <Dropdown trigger={trigger} className={styles.addWidgetContainer}>
            {MULTI_INSTANCE_WIDGETS.map((widgetType) => (
                <DropdownItem key={widgetType} onClick={() => onAdd(widgetType)} icon={widgetIcons[widgetType]}>
                    {widgetLabels[widgetType]}
                </DropdownItem>
            ))}
        </Dropdown>
    );
}
