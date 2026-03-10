import { Fragment, h } from 'preact';
import styles from './AiChatForm.module.css';

/**
 * @param {object} props
 * @param {import('../../../types/new-tab.js').AIModels} props.models
 * @param {string} [props.selectedModelId]
 * @param {{right: number, top: number}} props.dropdownPos
 * @param {(id: string) => void} props.onSelect
 * @param {string} props.ariaLabel
 * @param {string} props.sectionHeader
 * @param {import('preact').RefObject<HTMLUListElement>} [props.dropdownRef]
 */
export function ModelDropdown({ models, selectedModelId, dropdownPos, onSelect, ariaLabel, sectionHeader, dropdownRef }) {
    const freeModels = models.filter((m) => m.entityHasAccess !== false);
    const premiumModels = models.filter((m) => m.entityHasAccess === false);

    return (
        <ul
            ref={dropdownRef}
            class={styles.modelDropdown}
            role="listbox"
            aria-label={ariaLabel}
            style={{ right: `${dropdownPos.right}px`, top: `${dropdownPos.top}px` }}
        >
            {freeModels.map((model) => (
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
                    {model.name}
                </li>
            ))}
            {premiumModels.length > 0 && (
                <Fragment>
                    <li role="separator" class={styles.modelSectionDivider} />
                    <li role="presentation" class={styles.modelSectionHeader}>
                        {sectionHeader}
                    </li>
                    {premiumModels.map((model) => (
                        <li key={model.id} role="option" aria-disabled="true" class={`${styles.modelOption} ${styles.modelOptionDisabled}`}>
                            {model.name}
                        </li>
                    ))}
                </Fragment>
            )}
        </ul>
    );
}
