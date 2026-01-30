import { h } from 'preact';
import styles from './Stock.module.css';
import { WidgetSettingsMenu } from '../../components/WidgetSettingsMenu.js';

/**
 * @typedef {import('../../../types/new-tab.js').StockData} StockData
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 * @typedef {'expanded' | 'collapsed'} Expansion
 */

/**
 * Stock widget - displays multiple stocks in rows
 * Supports both expanded (wide) and collapsed (narrow) modes
 *
 * @param {Object} props
 * @param {StockData[]} props.data
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function Stock({ data, instanceId, config, onUpdateConfig }) {
    const expansion = config && 'expansion' in config ? config.expansion : 'expanded';
    const isExpanded = expansion === 'expanded';

    return (
        <article
            className={styles.widget}
            data-expansion={expansion}
            data-testid="stock-widget"
            aria-label={`Stocks: ${data.map((s) => s.symbol).join(', ')}`}
        >
            <header className={styles.header}>
                <h2 className={styles.title}>Stocks</h2>
                {instanceId && onUpdateConfig ? (
                    <WidgetSettingsMenu widgetType="stock" config={config || null} onUpdateConfig={onUpdateConfig} />
                ) : null}
            </header>

            <div className={styles.body}>
                {data.map((stock) => (
                    <StockRow key={stock.symbol} stock={stock} showChart={isExpanded} />
                ))}
            </div>
        </article>
    );
}

/**
 * Single stock row with symbol, company, optional chart, price, and change indicator
 * @param {Object} props
 * @param {StockData} props.stock
 * @param {boolean} [props.showChart]
 */
function StockRow({ stock, showChart = false }) {
    const isPositive = stock.change >= 0;
    const changeSign = isPositive ? '+' : '';

    return (
        <div className={styles.row} data-status={isPositive ? 'positive' : 'negative'}>
            <div className={styles.info}>
                <span className={styles.symbol}>{stock.symbol}</span>
                <span className={styles.companyName}>{stock.companyName}</span>
            </div>

            {showChart && <StockChart isPositive={isPositive} />}

            <div className={styles.pricing}>
                <span className={styles.price}>{stock.latestPrice.toFixed(2)}</span>
                <span className={styles.change}>
                    {changeSign}
                    {stock.change.toFixed(2)}
                </span>
            </div>

            <div className={styles.arrow} aria-hidden="true">
                {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
            </div>
        </div>
    );
}

/**
 * Chart/sparkline visualization for stock price movement
 * @param {Object} props
 * @param {boolean} props.isPositive
 */
function StockChart({ isPositive }) {
    return (
        <div className={styles.chart} data-type={isPositive ? 'positive' : 'negative'}>
            {isPositive ? <PositiveChart /> : <NegativeChart />}
        </div>
    );
}

/**
 * Positive growth chart from Figma
 */
function PositiveChart() {
    return (
        <svg viewBox="0 0 190 16" fill="none" className={styles.chartSvg}>
            <g clipPath="url(#clip-positive)">
                <path
                    d="M3.30388 12.9314C2.10551 13.7751 -1.50195 14.9959 -1.50195 14.9959V16.7805H190.563V0.585408C187.18 0.231582 186.129 2.43906 182.678 2.43907C176.294 2.43907 175.18 8.65414 171.617 6.73798C169.029 5.34579 167.266 4.08079 163.541 4.10004C160.793 4.11424 159.538 4.91568 157.117 5.59105C154.33 6.36856 152.292 6.59738 150.326 7.88491C148.385 9.15554 149.663 10.5801 147.572 11.7845C145.222 13.138 144.194 12.7415 142.5 13.2683C140.806 13.7951 139.933 14.9269 135.553 14.9269C131.174 14.9269 132.267 12.7631 130.135 11.7845C127.046 10.3659 122.262 11.9835 120.04 10.1788C119.073 9.39289 119.633 8.6987 118.755 7.88491C117.488 6.71018 115.277 7.70736 114.338 6.34151C113.399 4.97565 113.211 0.292725 110.959 0.292725C106.108 0.292725 108.134 7.79062 104.439 7.88491C101.398 7.9625 101.015 5.85598 98.0145 5.59105C94.9272 5.31851 92.9348 5.59105 90.3055 6.73798C86.2709 8.49787 88.8044 10.6342 83.5474 10.8293C80.7658 10.9326 79.417 13.0732 76.4131 13.0732C73.4091 13.0732 72.2474 10.2961 70.1152 8.91715C67.5592 7.2641 65.8971 5.29769 61.8556 5.59105C58.398 5.84203 59.1035 8.98704 55.6149 8.91715C52.9139 8.86304 52.7925 6.90418 50.1085 6.73798C47.6754 6.58732 45.7991 7.15376 44.6838 7.88491C43.5685 8.61607 43.7451 8.87809 42.9941 9.95126C42.3155 10.921 41.6799 11.7845 38.9121 11.7845C33.694 11.7845 33.2782 8.72843 29.7347 6.73798C26.1813 4.74197 25.9543 1.81024 20.7409 1.5768C15.6808 1.35022 13.6272 3.60674 10.2787 5.59105C6.22242 7.99478 6.95755 10.3592 3.30388 12.9314Z"
                    fill="#5B9E4D"
                    fillOpacity="0.2"
                    stroke="#4CBA3C"
                    strokeLinecap="round"
                />
                <line x1="0.5" y1="7.10974" x2="189.5" y2="7.10974" stroke="black" strokeOpacity="0.24" strokeLinecap="round" strokeDasharray="2 2" />
            </g>
            <defs>
                <clipPath id="clip-positive">
                    <rect width="190" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * Negative growth chart from Figma
 */
function NegativeChart() {
    return (
        <svg viewBox="0 0 190 16" fill="none" className={styles.chartSvg}>
            <g clipPath="url(#clip-negative)">
                <path
                    d="M5.82018 8.91715C3.26654 8.91715 -1.50195 2.43907 -1.50195 2.43907V16.7805H192.441V13.2683C189.058 12.9145 183.688 4.10004 180.237 4.10004C173.854 4.10005 173.098 8.65414 169.536 6.73798C166.947 5.34579 166.689 4.4686 162.964 4.48785C160.217 4.50205 159.538 4.91568 157.117 5.59105C154.33 6.36856 152.292 6.59738 150.326 7.88491C148.385 9.15554 149.663 10.5801 147.572 11.7845C145.222 13.138 144.194 12.7415 142.5 13.2683C140.806 13.7951 139.933 14.9269 135.553 14.9269C131.174 14.9269 132.267 12.7631 130.135 11.7845C127.046 10.3659 122.262 11.9835 120.04 10.1788C119.073 9.39289 119.633 8.6987 118.755 7.88491C117.488 6.71018 115.277 7.70736 114.338 6.34151C113.399 4.97565 113.211 0.292725 110.959 0.292725C106.108 0.292725 108.134 7.79062 104.439 7.88491C101.398 7.9625 101.015 5.85598 98.0145 5.59105C94.9272 5.31851 92.9348 5.59105 90.3055 6.73798C86.2709 8.49787 88.8044 10.6342 83.5475 10.8293C80.7658 10.9326 79.417 13.0732 76.4131 13.0732C73.4091 13.0732 72.2474 10.2961 70.1152 8.91715C67.5592 7.2641 65.8971 5.29769 61.8556 5.59105C58.398 5.84203 59.1035 8.98704 55.615 8.91715C52.9139 8.86304 52.7925 6.90418 50.1085 6.73798C47.6754 6.58732 45.7991 7.15376 44.6838 7.88491C43.5685 8.61607 43.7451 8.87809 42.9941 9.95126C42.3155 10.921 41.6799 11.7845 38.9121 11.7845C33.694 11.7845 33.2782 8.72843 29.7347 6.73798C26.1813 4.74197 25.9543 1.81024 20.7409 1.5768C15.6808 1.35022 11.7332 4.44412 10.2787 5.59105C8.82413 6.73798 8.37382 8.91715 5.82018 8.91715Z"
                    fill="#EB102D"
                    fillOpacity="0.2"
                    stroke="#EB102D"
                    strokeLinecap="round"
                />
                <line x1="0.5" y1="9.5" x2="189.5" y2="9.5" stroke="black" strokeOpacity="0.24" strokeLinecap="round" strokeDasharray="2 2" />
            </g>
            <defs>
                <clipPath id="clip-negative">
                    <rect width="190" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * Arrow up icon for positive change
 */
function ArrowUpIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M2.44178 7.81272C2.19761 8.05671 1.80188 8.05656 1.55789 7.81239C1.31391 7.56823 1.31405 7.1725 1.55822 6.92851L6.87351 1.6172C7.70324 0.788086 9.04784 0.788082 9.87758 1.61719L15.1928 6.92833C15.4369 7.17232 15.4371 7.56805 15.1931 7.81222C14.9491 8.05639 14.5534 8.05654 14.3092 7.81255L9.00056 2.50793V15.375C9.00056 15.7202 8.72074 16 8.37556 16C8.03038 16 7.75056 15.7202 7.75056 15.375V2.50791L2.44178 7.81272Z"
                fill="#399F29"
            />
        </svg>
    );
}

/**
 * Arrow down icon for negative change
 */
function ArrowDownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M2.44178 8.18731C2.19761 7.94333 1.80188 7.94347 1.55789 8.18764C1.31391 8.43181 1.31405 8.82754 1.55822 9.07153L6.87351 14.3828C7.70324 15.212 9.04784 15.212 9.87758 14.3828L15.1928 9.0717C15.4369 8.82772 15.4371 8.43199 15.1931 8.18782C14.9491 7.94365 14.5534 7.9435 14.3092 8.18748L9.00056 13.4921V0.625C9.00056 0.279822 8.72074 -4.11621e-09 8.37556 0C8.03038 4.1162e-09 7.75056 0.279822 7.75056 0.625V13.4921L2.44178 8.18731Z"
                fill="#EB102D"
            />
        </svg>
    );
}
