import { Fragment, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import styles from './ModelSelector.module.css';
import { getModelIcon } from './Icons';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').AIModelItem} AIModelItem
 */

/**
 * Returns the badge label for a model row, or null when no badge should show.
 *
 * @param {AIModelItem} model
 * @param {ReturnType<typeof useTypedTranslationWith<Strings>>['t']} t
 * @returns {string | null}
 */
function getRowBadgeLabel(model, t) {
    const tiers = model.accessTier ?? [];
    if (tiers.length === 1 && tiers[0] === 'internal') return t('omnibar_modelBadgeInternal');
    if (model.isBeta) return t('omnibar_modelBadgeBeta');
    if (tiers.includes('free')) return null;
    if (tiers.includes('plus')) return t('omnibar_modelBadgePlus');
    if (tiers.includes('pro')) return t('omnibar_modelBadgePro');
    return null;
}

/**
 * @param {object} props
 * @param {import('../../../../../types/new-tab.js').AIModelSections} props.sections
 * @param {string} [props.selectedModelId]
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {(options: {restoreFocus: boolean}) => void} props.onClose
 * @param {(id: string) => void} props.onSelect
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} props.ariaLabel
 * @param {import('preact').RefObject<HTMLUListElement>} [props.dropdownRef]
 */
export function ModelDropdown({ sections, selectedModelId, dropdownPos, onClose, onSelect, onUpsell, ariaLabel, dropdownRef }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const allModels = sections.flatMap((section) => section.items);
    const optionIndexById = new Map(allModels.map((model, index) => [model.id, index]));
    const enabledModelIndices = allModels.reduce(
        /**
         * @param {number[]} indices
         * @param {import('../../../../../types/new-tab.js').AIModelItem} model
         * @param {number} index
         */
        (indices, model, index) => {
            if (model.isEnabled) indices.push(index);
            return indices;
        },
        [],
    );

    const getInitialActiveIndex = () => {
        if (enabledModelIndices.length === 0) return -1;

        const selectedIndex = selectedModelId ? allModels.findIndex((model) => model.id === selectedModelId && model.isEnabled) : -1;
        return selectedIndex >= 0 ? selectedIndex : enabledModelIndices[0];
    };

    const [activeIndex, setActiveIndex] = useState(getInitialActiveIndex);
    const clearActiveIndex = () => setActiveIndex(-1);

    /**
     * @param {number} nextEnabledPosition
     */
    const focusEnabledIndex = (nextEnabledPosition) => {
        if (enabledModelIndices.length === 0) return;

        if (nextEnabledPosition < 0) {
            setActiveIndex(enabledModelIndices[enabledModelIndices.length - 1]);
        } else if (nextEnabledPosition >= enabledModelIndices.length) {
            setActiveIndex(enabledModelIndices[0]);
        } else {
            setActiveIndex(enabledModelIndices[nextEnabledPosition]);
        }
    };

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            dropdownRef?.current?.focus();
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [dropdownRef]);

    /**
     * @param {number} index
     */
    const getOptionId = (index) => `model-option-${allModels[index]?.id ?? index}`;

    /** @type {(e: KeyboardEvent) => void} */
    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                focusEnabledIndex(enabledModelIndices.indexOf(activeIndex) + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                focusEnabledIndex(enabledModelIndices.indexOf(activeIndex) - 1);
                break;
            case 'Home':
                e.preventDefault();
                focusEnabledIndex(0);
                break;
            case 'End':
                e.preventDefault();
                focusEnabledIndex(enabledModelIndices.length - 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < allModels.length) {
                    onSelect(allModels[activeIndex].id);
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
            class={styles.modelDropdown}
            tabIndex={-1}
            role="listbox"
            aria-label={ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
            style={{ right: dropdownPos.right, left: dropdownPos.left, top: dropdownPos.top }}
            onKeyDown={handleKeyDown}
            onMouseLeave={clearActiveIndex}
        >
            {sections.map((section, sectionIndex) => {
                const isUpsellSection = section.items.length > 0 && section.items.every((model) => !model.isEnabled);
                const sectionUpsell = section.items.find((model) => model.upsell)?.upsell ?? 'subscribe';
                return (
                    <Fragment key={sectionIndex}>
                        {isUpsellSection ? (
                            <Fragment>
                                <li role="separator" class={styles.modelSectionDivider} />
                                <li role="presentation" class={styles.modelUpsellHeader}>
                                    {section.header && <span class={styles.modelUpsellText}>{section.header}</span>}
                                    <button
                                        type="button"
                                        class={styles.modelUpsellCta}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpsell(sectionUpsell);
                                        }}
                                    >
                                        {sectionUpsell === 'upgrade' ? t('omnibar_upgrade') : t('omnibar_tryForFree')}
                                    </button>
                                </li>
                            </Fragment>
                        ) : (
                            section.header && (
                                <Fragment>
                                    <li role="separator" class={styles.modelSectionDivider} />
                                    <li role="presentation" class={styles.modelSectionHeader}>
                                        {section.header}
                                    </li>
                                </Fragment>
                            )
                        )}
                        {section.items.map((model) => {
                            const Icon = getModelIcon(model.id);
                            const optionIndex = optionIndexById.get(model.id) ?? -1;
                            const badgeLabel = getRowBadgeLabel(model, t);
                            return (
                                <li
                                    key={model.id}
                                    id={getOptionId(optionIndex)}
                                    role="option"
                                    aria-selected={model.isEnabled ? model.id === selectedModelId : undefined}
                                    aria-disabled={!model.isEnabled || undefined}
                                    class={cn(
                                        styles.modelOption,
                                        model.isEnabled && activeIndex === optionIndex && styles.modelOptionActive,
                                        !model.isEnabled && styles.modelOptionDisabled,
                                        model.isEnabled && model.id === selectedModelId && styles.modelOptionSelected,
                                    )}
                                    onMouseOver={model.isEnabled ? () => setActiveIndex(optionIndex) : undefined}
                                    onClick={
                                        model.isEnabled
                                            ? (e) => {
                                                  e.stopPropagation();
                                                  onSelect(model.id);
                                              }
                                            : undefined
                                    }
                                >
                                    {Icon && <Icon />}
                                    <div class={styles.modelOptionLabel}>
                                        <span class={styles.modelOptionName}>{model.name}</span>
                                        {model.description && <span class={styles.modelOptionDescription}>{model.description}</span>}
                                    </div>
                                    {badgeLabel && <span class={styles.modelOptionBadge}>{badgeLabel}</span>}
                                </li>
                            );
                        })}
                    </Fragment>
                );
            })}
        </ul>
    );
}
