import { h } from 'preact';
import cn from 'classnames';
import { useId, useContext } from 'preact/hooks';

import { DuckFoot, Shield } from '../../components/Icons.js';
import styles from './VisibilityMenu.module.css';
import { useTypedTranslation } from '../../types.js';
import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { usePlatformName } from '../../settings.provider.js';
import { CustomizerThemesContext } from '../CustomizerProvider.js';

/**
 * @import { Widgets, WidgetConfigItem } from '../../../types/new-tab.js'
 * @import { VisibilityRowData, VisibilityRowState } from './Customizer.js'
 */

/**
 * When the button is pressed, we dispatch an event to allow widgets to provide
 * meta data like translated titles
 *
 * @param {object} props
 * @param {VisibilityRowData[]} props.rows
 */
export function VisibilityMenu({ rows }) {
    const MENU_ID = useId();

    return (
        <ul className={cn(styles.list)}>
            {rows.map((row) => {
                return (
                    <li key={row.id}>
                        <label className={styles.menuItemLabel} htmlFor={MENU_ID + row.id}>
                            <input
                                type="checkbox"
                                checked={row.visibility === 'visible'}
                                onChange={() => row.toggle?.(row.id)}
                                id={MENU_ID + row.id}
                                class={styles.checkbox}
                            />
                            <span aria-hidden={true} className={styles.checkboxIcon}>
                                {row.visibility === 'visible' && (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M3.5 9L6 11.5L12.5 5"
                                            stroke="white"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                )}
                            </span>
                            <span className={styles.svg}>
                                {row.icon === 'shield' && <DuckFoot />}
                                {row.icon === 'star' && <Shield />}
                            </span>
                            <span>{row.title ?? row.id}</span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * @param {object} props
 * @param {VisibilityRowData[]} props.rows
 */
export function EmbeddedVisibilityMenu({ rows }) {
    const platformName = usePlatformName();
    const { browser } = useContext(CustomizerThemesContext);
    return (
        <ul className={cn(styles.list, styles.embedded)}>
            {rows.map((row) => {
                return (
                    <li key={row.id}>
                        <div class={cn(styles.menuItemLabel, styles.menuItemLabelEmbedded)}>
                            <span className={styles.svg}>
                                {row.icon === 'shield' && <DuckFoot />}
                                {row.icon === 'star' && <Shield />}
                            </span>
                            <span>{row.title ?? row.id}</span>
                            <Switch
                                theme={browser.value}
                                platformName={platformName}
                                checked={row.visibility === 'visible'}
                                size="medium"
                                onChecked={() => row.toggle?.(row.id)}
                                onUnchecked={() => row.toggle?.(row.id)}
                                ariaLabel={`Toggle ${row.title}`}
                                pending={false}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

export function Heading() {
    const { t } = useTypedTranslation();
    return <h2 className="sr-only">{t('widgets_visibility_menu_title')}</h2>;
}

export function VisibilityMenuPopover({ children }) {
    return <div className={styles.dropdownInner}>{children}</div>;
}
