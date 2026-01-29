import { h } from 'preact';
import { useContext } from 'preact/hooks';
import styles from './Stock.module.css';
import { StockContext } from './StockProvider.js';

/**
 * Empty state component for stock widget when no symbol is configured
 */
export function StockEmptyState() {
    const { openSetSymbolDialog } = useContext(StockContext);

    return (
        <div className={styles.stock} data-testid="stock-widget-empty">
            <div className={styles.emptyStateTitle}>Stock</div>
            <div className={styles.emptyStateDescription}>Set a ticker symbol to track a stock</div>
            <button className={styles.emptyStateButton} onClick={openSetSymbolDialog} type="button">
                Set symbol
            </button>
        </div>
    );
}
