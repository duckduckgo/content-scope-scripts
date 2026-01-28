import { h } from 'preact';
import styles from './Stock.module.css';

/**
 * @typedef {import('../../../types/new-tab.js').StockData} StockData
 */

/**
 * Minimal throwaway UI for stock widget - displays price, change, and symbol
 *
 * @param {Object} props
 * @param {StockData} props.data
 */
export function Stock({ data }) {
    const isPositive = data.change >= 0;
    const changeClass = isPositive ? styles.positive : styles.negative;
    const changeSign = isPositive ? '+' : '';
    const percentFormatted = (data.changePercent * 100).toFixed(2);

    return (
        <div className={styles.stock} data-testid="stock-widget">
            <div className={styles.symbol}>{data.symbol}</div>
            <div className={styles.companyName}>{data.companyName}</div>
            <div className={styles.price}>
                {data.currency === 'USD' ? '$' : data.currency}
                {data.latestPrice.toFixed(2)}
            </div>
            <div className={`${styles.change} ${changeClass}`}>
                {changeSign}
                {data.change.toFixed(2)} ({changeSign}
                {percentFormatted}%)
            </div>
        </div>
    );
}
