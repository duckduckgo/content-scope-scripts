import { Fragment, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { getUpsellCtaLabel } from '../../../utils.js';
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
    switch (model.accessTier) {
        case 'internal':
            return t('omnibar_modelBadgeInternal');
        case 'plus':
            return t('omnibar_modelBadgePlus');
        case 'pro':
            return t('omnibar_modelBadgePro');
        default:
            return null;
    }
}

/**
 * @param {object} props
 * @param {import('../../../../../types/new-tab.js').AIModelSections} props.sections
 * @param {string} [props.selectedModelId]
 * @param {import('../useDropdown.js').DropdownPosition} props.dropdownPos
 * @param {(options: {restoreFocus: boolean}) => void} props.onClose
 * @param {(id: string) => void} props.onSelect
 * @param {(type?: 'subscribe' | 'upgrade') => void} props.onUpsell
 * @param {string} [props.className] - Extra class(es) for the dropdown root.
 * @param {string} props.ariaLabel
 * @param {boolean} props.isEligibleForFreeTrial - When false, a 'subscribe' upsell shows "Upgrade" instead of "Try for free".
 * @param {import('preact').RefObject<HTMLUListElement>} [props.dropdownRef]
 */
export function ModelDropdown({
    sections,
    selectedModelId,
    dropdownPos,
    onClose,
    onSelect,
    onUpsell,
    className,
    ariaLabel,
    isEligibleForFreeTrial,
    dropdownRef,
}) {
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
            if (model.isAvailable) indices.push(index);
            return indices;
        },
        [],
    );
    const upsellSections = sections
        .map((section, sectionIndex) => ({ section, sectionIndex }))
        .filter(({ section }) => section.items.length > 0 && section.items.every((model) => !model.isAvailable));
    enabledModelIndices.push(...upsellSections.map((_, index) => allModels.length + index));

    const getInitialActiveIndex = () => {
        if (enabledModelIndices.length === 0) return -1;

        const selectedIndex = selectedModelId ? allModels.findIndex((model) => model.id === selectedModelId && model.isAvailable) : -1;
        return selectedIndex >= 0 ? selectedIndex : enabledModelIndices[0];
    };

    const [activeIndex, setActiveIndex] = useState(getInitialActiveIndex);
    const clearActiveIndex = () => setActiveIndex(-1);

    /**
     * @param {'subscribe' | 'upgrade'} type
     * @param {boolean} restoreFocus
     */
    const activateUpsell = (type, restoreFocus) => {
        onUpsell(type);
        onClose({ restoreFocus });
    };

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
    const getOptionId = (index) => {
        const upsellSection = upsellSections[index - allModels.length];
        if (upsellSection) return `model-upsell-${upsellSection.sectionIndex}`;
        return `model-option-${allModels[index]?.id ?? index}`;
    };

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
                if (activeIndex >= allModels.length) {
                    const upsellSection = upsellSections[activeIndex - allModels.length]?.section;
                    activateUpsell(upsellSection?.items.find((model) => model.upsell)?.upsell ?? 'subscribe', true);
                } else if (activeIndex >= 0 && activeIndex < allModels.length) {
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
            class={cn(styles.modelDropdown, className)}
            tabIndex={-1}
            role="listbox"
            aria-label={ariaLabel}
            aria-activedescendant={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
            style={{ right: dropdownPos.right, left: dropdownPos.left, top: dropdownPos.top }}
            onKeyDown={handleKeyDown}
            onMouseLeave={clearActiveIndex}
        >
            {sections.map((section, sectionIndex) => {
                const isUpsellSection = section.items.length > 0 && section.items.every((model) => !model.isAvailable);
                const sectionUpsell = section.items.find((model) => model.upsell)?.upsell ?? 'subscribe';
                const upsellIndex = allModels.length + upsellSections.findIndex((entry) => entry.sectionIndex === sectionIndex);
                return (
                    <Fragment key={sectionIndex}>
                        {isUpsellSection ? (
                            <Fragment>
                                <li role="separator" class={styles.modelSectionDivider} />
                                <li
                                    id={`model-upsell-${sectionIndex}`}
                                    role="option"
                                    aria-selected={false}
                                    class={cn(styles.modelUpsellHeader, activeIndex === upsellIndex && styles.modelUpsellHeaderActive)}
                                    onMouseOver={() => setActiveIndex(upsellIndex)}
                                    onClick={() => activateUpsell(sectionUpsell, false)}
                                >
                                    {section.header && <span class={styles.modelUpsellText}>{section.header}</span>}
                                    <span class={styles.modelUpsellCta}>
                                        {getUpsellCtaLabel(sectionUpsell, isEligibleForFreeTrial) === 'upgrade'
                                            ? t('omnibar_upgrade')
                                            : t('omnibar_tryForFree')}
                                    </span>
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
                            // Rows in an all-disabled section act as extra triggers for the
                            // section's upsell CTA: dimmed, but hoverable and clickable.
                            const isUpsellRow = !model.isAvailable && isUpsellSection;
                            const isInteractive = model.isAvailable || isUpsellRow;
                            return (
                                <li
                                    key={model.id}
                                    id={getOptionId(optionIndex)}
                                    role="option"
                                    aria-selected={model.isAvailable ? model.id === selectedModelId : isUpsellRow ? false : undefined}
                                    aria-disabled={(!model.isAvailable && !isUpsellRow) || undefined}
                                    class={cn(
                                        styles.modelOption,
                                        isInteractive && activeIndex === optionIndex && styles.modelOptionActive,
                                        isUpsellRow && styles.modelOptionUpsell,
                                        !model.isAvailable && !isUpsellRow && styles.modelOptionDisabled,
                                        model.isAvailable && model.id === selectedModelId && styles.modelOptionSelected,
                                    )}
                                    onMouseOver={isInteractive ? () => setActiveIndex(optionIndex) : undefined}
                                    onClick={
                                        model.isAvailable
                                            ? (e) => {
                                                  e.stopPropagation();
                                                  onSelect(model.id);
                                              }
                                            : isUpsellRow
                                              ? (e) => {
                                                    e.stopPropagation();
                                                    activateUpsell(sectionUpsell, false);
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
