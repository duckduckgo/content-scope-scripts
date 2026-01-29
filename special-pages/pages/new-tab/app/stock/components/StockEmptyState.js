import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import styles from './Stock.module.css';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Empty state component for stock widget when no symbol is configured
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function StockEmptyState({ instanceId }) {
    const [value, setValue] = useState('');
    const { updateInstanceConfig } = useContext(WidgetConfigContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim() && instanceId) {
            updateInstanceConfig(instanceId, { symbol: value.trim() });
        }
    };

    return (
        <div className={styles.stock} data-testid="stock-widget-empty">
            <div className={styles.emptyStateTitle}>Stock</div>
            <form className={styles.emptyStateForm} onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={styles.emptyStateInput}
                    placeholder="Enter ticker symbol"
                    value={value}
                    onInput={(e) => setValue(/** @type {HTMLInputElement} */ (e.target).value)}
                />
                <button type="submit" className={styles.emptyStateButton} disabled={!value.trim()}>
                    Set symbol
                </button>
            </form>
        </div>
    );
}
