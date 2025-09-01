import cn from 'classnames';
import { h } from 'preact';
import { useContext } from 'preact/hooks';

import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { usePlatformName } from '../../settings.provider.js';
import { CustomizerThemesContext } from '../CustomizerProvider.js';
import styles from './VisibilityMenu.module.css';

/**
 * @import { VisibilityRowData } from './CustomizerMenu.js';
 */

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
                            <span class={styles.svg}>{row.icon}</span>
                            <span class={styles.title}>{row.title ?? row.id}</span>
                            <Switch
                                theme={browser.value}
                                platformName={platformName}
                                checked={row.visibility === 'visible'}
                                size="medium"
                                onChecked={() => row.toggle?.(row.id)}
                                onUnchecked={() => row.toggle?.(row.id)}
                                ariaLabel={`Toggle ${row.title}`}
                                pending={false}
                                inputProps={{
                                    disabled: row.enabled === false,
                                }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
