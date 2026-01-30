import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useContext, useState, useRef, useEffect } from 'preact/hooks';
import styles from './Stock.module.css';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Close icon for the button
 */
function CloseIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

/**
 * Empty state component for stock widget when no symbols are configured
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function StockEmptyState({ instanceId }) {
    const [values, setValues] = useState(['', '', '']);
    const [panelPosition, setPanelPosition] = useState(/** @type {{top: number, left: number, width: number} | null} */ (null));
    const inputRefs = useRef(/** @type {(HTMLInputElement | null)[]} */ ([null, null, null]));
    const anchorRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    const { updateInstanceConfig, removeInstance, getConfigForInstance } = useContext(WidgetConfigContext);

    // Get expansion state from config (default to 'expanded')
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const expansion = config && 'expansion' in config ? config.expansion : 'expanded';

    // Calculate panel position based on anchor element
    useEffect(() => {
        const updatePosition = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setPanelPosition({
                    top: rect.top + window.scrollY - 11, // 11px above
                    left: rect.left + window.scrollX - 10, // 10px to the left
                    width: rect.width + 20, // 20px wider (10px each side)
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, []);

    // Focus first input once panel is positioned
    useEffect(() => {
        if (panelPosition) {
            inputRefs.current[0]?.focus();
        }
    }, [panelPosition]);

    /**
     * @param {number} index
     * @param {string} value
     */
    const updateValue = (index, value) => {
        setValues((prev) => {
            const next = [...prev];
            next[index] = value.toUpperCase();
            return next;
        });
    };

    /**
     * @param {number} index
     * @param {KeyboardEvent} e
     */
    const handleKeyDown = (index, e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next input or submit if on last
            if (index < 2) {
                inputRefs.current[index + 1]?.focus();
            } else {
                handleSubmit();
            }
        }
    };

    const handleSubmit = () => {
        const symbols = values.map((v) => v.trim()).filter(Boolean);
        if (symbols.length > 0 && instanceId) {
            updateInstanceConfig(instanceId, { symbols });
        }
    };

    const handleClose = () => {
        if (instanceId) {
            removeInstance(instanceId);
        }
    };

    return (
        <div
            className={styles.emptyStateAnchor}
            ref={anchorRef}
            data-expansion={expansion === 'collapsed' ? 'collapsed' : 'expanded'}
        >
            {createPortal(
                <div className={styles.emptyStateOverlay}>
                    <div className={styles.emptyStateBackdrop} />
                    {panelPosition && (
                        <div
                            className={styles.emptyStatePanel}
                            data-testid="stock-widget-empty"
                            style={{
                                top: `${panelPosition.top}px`,
                                left: `${panelPosition.left}px`,
                                width: `${panelPosition.width}px`,
                            }}
                        >
                            <div className={styles.emptyStateHeader}>
                                <div className={styles.emptyStateTitle}>Stocks</div>
                                <button
                                    type="button"
                                    className={styles.emptyStateCloseButton}
                                    onClick={handleClose}
                                    aria-label="Close"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className={styles.emptyStateInputs}>
                                {[0, 1, 2].map((index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el;
                                        }}
                                        type="text"
                                        className={styles.emptyStateInput}
                                        placeholder="SYMBOL"
                                        value={values[index]}
                                        onInput={(e) => updateValue(index, /** @type {HTMLInputElement} */ (e.target).value)}
                                        onKeyDown={(e) => handleKeyDown(index, /** @type {KeyboardEvent} */ (e))}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
}
