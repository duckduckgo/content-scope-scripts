import { Fragment, h } from 'preact';
import styles from './AiChatForm.module.css';
import { getModelIcon } from '../../components/Icons';

/**
 * @param {object} props
 * @param {import('../../../types/new-tab.js').AIModelSections} props.sections
 * @param {string} [props.selectedModelId]
 * @param {{right: number, top: number}} props.dropdownPos
 * @param {(id: string) => void} props.onSelect
 * @param {string} props.ariaLabel
 * @param {import('preact').RefObject<HTMLUListElement>} [props.dropdownRef]
 */
export function ModelDropdown({ sections, selectedModelId, dropdownPos, onSelect, ariaLabel, dropdownRef }) {
    return (
        <ul
            ref={dropdownRef}
            class={styles.modelDropdown}
            role="listbox"
            aria-label={ariaLabel}
            style={{ right: `${dropdownPos.right}px`, top: `${dropdownPos.top}px` }}
        >
            {sections.map((section, sectionIndex) => (
                <Fragment key={sectionIndex}>
                    {section.header && (
                        <Fragment>
                            <li role="separator" class={styles.modelSectionDivider} />
                            <li role="presentation" class={styles.modelSectionHeader}>
                                {section.header}
                            </li>
                        </Fragment>
                    )}
                    {section.items.map((model) => {
                        const Icon = getModelIcon(model.id);
                        if (!model.isEnabled) {
                            return (
                                <li
                                    key={model.id}
                                    role="option"
                                    aria-disabled="true"
                                    class={`${styles.modelOption} ${styles.modelOptionDisabled}`}
                                >
                                    {Icon && <Icon />}
                                    <span>{model.name}</span>
                                </li>
                            );
                        }
                        return (
                            <li
                                key={model.id}
                                role="option"
                                aria-selected={model.id === selectedModelId}
                                class={`${styles.modelOption} ${model.id === selectedModelId ? styles.modelOptionSelected : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(model.id);
                                }}
                            >
                                {Icon && <Icon />}
                                <span>{model.name}</span>
                            </li>
                        );
                    })}
                </Fragment>
            ))}
        </ul>
    );
}
