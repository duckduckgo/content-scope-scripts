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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <g clipPath="url(#clip-location-widget)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.6495 1.86167C14.8343 1.53148 14.4693 1.16644 14.1391 1.35128L1.31886 8.52787C1.27871 8.55034 1.26831 8.5709 1.26366 8.58295C1.25682 8.60069 1.25339 8.62864 1.26196 8.66147C1.27052 8.69429 1.28716 8.71701 1.30179 8.72914C1.31174 8.73739 1.33086 8.75024 1.37686 8.75024H4.92559C6.20965 8.75024 7.25059 9.79118 7.25059 11.0752V14.624C7.25059 14.67 7.26344 14.6891 7.27169 14.699C7.28382 14.7137 7.30654 14.7303 7.33936 14.7389C7.37219 14.7474 7.40014 14.744 7.41787 14.7372C7.42993 14.7325 7.45048 14.7221 7.47296 14.682L14.6495 1.86167ZM13.5285 0.26055C14.9594 -0.540427 16.5412 1.04136 15.7402 2.47224L8.56369 15.2925C7.87496 16.5229 6.00059 16.034 6.00059 14.624V11.0752C6.00059 10.4815 5.51929 10.0002 4.92559 10.0002H1.37686C-0.0331622 10.0002 -0.522076 8.12588 0.708282 7.43714L13.5285 0.26055Z"
                        fill="currentColor"
                    />
                </g>
                <defs>
                    <clipPath id="clip-location-widget">
                        <rect width="16" height="16" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        ),
        news: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M8.375 10.75C8.72018 10.75 9 11.0298 9 11.375C9 11.7202 8.72018 12 8.375 12H3.625C3.27982 12 3 11.7202 3 11.375C3 11.0298 3.27982 10.75 3.625 10.75H8.375Z"
                    fill="currentColor"
                />
                <path
                    d="M8.375 7.75C8.72018 7.75 9 8.02982 9 8.375C9 8.72018 8.72018 9 8.375 9H3.625C3.27982 9 3 8.72018 3 8.375C3 8.02982 3.27982 7.75 3.625 7.75H8.375Z"
                    fill="currentColor"
                />
                <path
                    d="M5.25 4C5.66421 4 6 4.33579 6 4.75V5.25C6 5.66421 5.66421 6 5.25 6H3.75C3.33579 6 3 5.66421 3 5.25V4.75C3 4.33579 3.33579 4 3.75 4H5.25Z"
                    fill="currentColor"
                />
                <path
                    d="M8.25 4C8.66421 4 9 4.33579 9 4.75V5.25C9 5.66421 8.66421 6 8.25 6H7.75C7.33579 6 7 5.66421 7 5.25V4.75C7 4.33579 7.33579 4 7.75 4H8.25Z"
                    fill="currentColor"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.125 1C11.1605 1 12 1.83947 12 2.875V3H14.125C15.1605 3 16 3.83947 16 4.875V12.25C16 13.7688 14.7688 15 13.25 15H4C1.79086 15 9.66391e-08 13.2091 0 11V2.875C1.10739e-08 1.83947 0.839466 1 1.875 1H10.125ZM1.875 2.25C1.52982 2.25 1.25 2.52982 1.25 2.875V11C1.25 12.5188 2.48122 13.75 4 13.75H11.085C10.8722 13.3823 10.75 12.9554 10.75 12.5V2.875C10.75 2.52982 10.4702 2.25 10.125 2.25H1.875ZM12 12.5C12 13.1904 12.5596 13.75 13.25 13.75C14.0784 13.75 14.75 13.0784 14.75 12.25V4.875C14.75 4.52982 14.4702 4.25 14.125 4.25H12V12.5Z"
                    fill="currentColor"
                />
            </svg>
        ),
        stock: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M13.875 1C15.0486 1 16 1.95139 16 3.125V5.375C16 5.72018 15.7202 6 15.375 6C15.0298 6 14.75 5.72018 14.75 5.375V3.13477L10.9424 6.94238C10.729 7.15557 10.3987 7.18219 10.1562 7.02246L10.0576 6.94238L8.75 5.63477L5.19238 9.19238C5.0752 9.30944 4.91564 9.375 4.75 9.375C4.58436 9.375 4.4248 9.30944 4.30762 9.19238L3 7.88477L1.25 9.63477V11C1.25026 12.5186 2.48138 13.75 4 13.75H12C13.5186 13.75 14.7497 12.5186 14.75 11V9.375C14.75 9.02982 15.0298 8.75 15.375 8.75C15.7202 8.75 16 9.02982 16 9.375V11C15.9997 13.2089 14.209 15 12 15H4C1.79102 15 0.000263864 13.2089 0 11V9.375C0 9.20254 0.0696586 9.0457 0.182617 8.93262L2.55762 6.55762L2.65332 6.48047C2.75528 6.41243 2.87561 6.375 3 6.375C3.16576 6.375 3.32517 6.44041 3.44238 6.55762L4.75 7.86523L8.30762 4.30762L8.40332 4.23047C8.50528 4.16243 8.62561 4.125 8.75 4.125C8.91576 4.125 9.07517 4.19041 9.19238 4.30762L10.5 5.61523L13.8652 2.25H11.375C11.0298 2.25 10.75 1.97018 10.75 1.625C10.75 1.27982 11.0298 1 11.375 1H13.875Z"
                    fill="currentColor"
                />
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
