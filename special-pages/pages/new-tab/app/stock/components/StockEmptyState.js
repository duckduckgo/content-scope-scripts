import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import styles from './Stock.module.css';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Empty state component for stock widget when no symbols are configured
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function StockEmptyState({ instanceId }) {
    const [values, setValues] = useState(['', '', '']);
    const { updateInstanceConfig } = useContext(WidgetConfigContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        const symbols = values.map((v) => v.trim().toUpperCase()).filter(Boolean);
        if (symbols.length > 0 && instanceId) {
            updateInstanceConfig(instanceId, { symbols });
        }
    };

    /**
     * @param {number} index
     * @param {string} value
     */
    const updateValue = (index, value) => {
        setValues((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const hasAnyValue = values.some((v) => v.trim());

    return (
        <div className={styles.stock} data-testid="stock-widget-empty">
            <div className={styles.emptyStateTitle}>Stocks</div>
            <form className={styles.emptyStateForm} onSubmit={handleSubmit}>
                {[0, 1, 2].map((index) => (
                    <input
                        key={index}
                        type="text"
                        className={styles.emptyStateInput}
                        placeholder={`Symbol ${index + 1}`}
                        value={values[index]}
                        onInput={(e) => updateValue(index, /** @type {HTMLInputElement} */ (e.target).value)}
                    />
                ))}
                <button type="submit" className={styles.emptyStateButton} disabled={!hasAnyValue}>
                    Set symbols
                </button>
            </form>
        </div>
    );
}
