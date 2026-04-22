import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import styles from './ReasoningPicker.module.css';
import { getReasoningEffortIcon } from './getReasoningEffortIcon';

/**
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 *
 * @typedef {object} ReasoningEffortOption
 * @property {ReasoningEffort} id - Stable server key
 * @property {string} label - Localized label
 * @property {string} description - Localized description
 */

/**
 * @param {object} props
 * @param {ReasoningEffortOption[]} props.options
 * @param {ReasoningEffort|null} [props.selectedEffort]
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {(options: {restoreFocus: boolean}) => void} props.onClose
 * @param {(id: ReasoningEffort) => void} props.onSelect
 * @param {string} props.ariaLabel
 * @param {import('preact').RefObject<HTMLUListElement>} [props.dropdownRef]
 */
export function ReasoningDropdown({ options, selectedEffort, dropdownPos, onClose, onSelect, ariaLabel, dropdownRef }) {
    const getInitialActiveIndex = () => {
        if (options.length === 0) return -1;
        const selectedIndex = selectedEffort ? options.findIndex((option) => option.id === selectedEffort) : -1;
        return selectedIndex >= 0 ? selectedIndex : 0;
    };

    const [activeIndex, setActiveIndex] = useState(getInitialActiveIndex);
    const clearActiveIndex = () => setActiveIndex(-1);

    /** @param {number} nextIndex */
    const focusIndex = (nextIndex) => {
        if (options.length === 0) return;
        if (nextIndex < 0) {
            setActiveIndex(options.length - 1);
        } else if (nextIndex >= options.length) {
            setActiveIndex(0);
        } else {
            setActiveIndex(nextIndex);
        }
    };

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            dropdownRef?.current?.focus();
        });
        return () => window.cancelAnimationFrame(frameId);
    }, [dropdownRef]);

    /** @param {number} index */
    const getOptionId = (index) => `reasoning-option-${options[index]?.id ?? index}`;

    /** @type {(e: KeyboardEvent) => void} */
    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusIndex(activeIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusIndex(activeIndex - 1);
                break;
            case 'Home':
                e.preventDefault();
                focusIndex(0);
                break;
            case 'End':
                e.preventDefault();
                focusIndex(options.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < options.length) {
                    onSelect(options[activeIndex].id);
                    onClose({ restoreFocus: true });
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose({ restoreFocus: true });
                break;
            case 'Tab':
                window.setTimeout(() => onClose({ restoreFocus: false }), 0);
                break;
        }
    };

    return (
        <ul
            ref={dropdownRef}
            class={styles.reasoningDropdown}
            tabIndex={-1}
            role="listbox"
            aria-label={ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
            style={{ right: dropdownPos.right, left: dropdownPos.left, top: dropdownPos.top }}
            onKeyDown={handleKeyDown}
            onMouseLeave={clearActiveIndex}
        >
            {options.map((option, index) => {
                const Icon = getReasoningEffortIcon(option.id);
                return (
                    <li
                        key={option.id}
                        id={getOptionId(index)}
                        role="option"
                        aria-selected={option.id === selectedEffort}
                        class={cn(
                            styles.reasoningOption,
                            activeIndex === index && styles.reasoningOptionActive,
                            option.id === selectedEffort && styles.reasoningOptionSelected,
                        )}
                        onMouseOver={() => setActiveIndex(index)}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(option.id);
                        }}
                    >
                        <span class={styles.checkmark} aria-hidden="true" />
                        {Icon && <Icon class={styles.optionIcon} />}
                        <div class={styles.optionLabel}>
                            <span class={styles.optionName}>{option.label}</span>
                            <span class={styles.optionDescription}>{option.description}</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
