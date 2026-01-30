import { h } from 'preact';
import styles from './Stock.module.css';
import { WidgetSettingsMenu } from '../../components/WidgetSettingsMenu.js';

/**
 * @typedef {import('../../../types/new-tab.js').StockData} StockData
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Stock widget - displays multiple stocks in rows
 *
 * @param {Object} props
 * @param {StockData[]} props.data
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function Stock({ data, instanceId, config, onUpdateConfig }) {
    return (
        <div className={styles.stock} data-testid="stock-widget">
            {instanceId && onUpdateConfig && (
                <WidgetSettingsMenu widgetType="stock" config={config || null} onUpdateConfig={onUpdateConfig} />
            )}
            <div className={styles.stockList}>
                {data.map((stock) => (
                    <StockRow key={stock.symbol} stock={stock} />
                ))}
            </div>
        </div>
    );
}

/**
 * Single stock row with symbol, price, and change
 * @param {Object} props
 * @param {StockData} props.stock
 */
function StockRow({ stock }) {
    const isPositive = stock.change >= 0;
    const changeClass = isPositive ? styles.positive : styles.negative;
    const changeSign = isPositive ? '+' : '';
    const percentFormatted = (stock.changePercent * 100).toFixed(2);

    return (
        <div className={styles.stockRow}>
            <div className={styles.stockInfo}>
                <span className={styles.symbol}>{stock.symbol}</span>
                <span className={styles.companyName}>{stock.companyName}</span>
            </div>
            <div className={styles.stockPricing}>
                <span className={styles.price}>
                    {stock.currency === 'USD' ? '$' : stock.currency}
                    {stock.latestPrice.toFixed(2)}
                </span>
                <span className={`${styles.change} ${changeClass}`}>
                    {changeSign}
                    {stock.change.toFixed(2)} ({changeSign}
                    {percentFormatted}%)
                </span>
            </div>
        </div>
    );
}
