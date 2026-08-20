import { Fragment, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../../../types';
import { DropdownSectionHeader } from '../dropdown/DropdownSectionHeader';
import { DropdownSeparator } from '../dropdown/DropdownSeparator';
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
    // Tier is named by the gated section's header, so only the internal-build marker
    // still earns a per-row badge.
    return model.accessTier === 'internal' ? t('omnibar_modelBadgeInternal') : null;
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
 * @param {import('preact').RefObject<HTMLUListElement>} [props.dropdownRef]
 */
export function ModelDropdown({ sections, selectedModelId, dropdownPos, onClose, onSelect, onUpsell, className, ariaLabel, dropdownRef }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const allModels = sections.flatMap((section) => section.items);
    const optionIndexById = new Map(allModels.map((model, index) => [model.id, index]));
    // Upsell behavior belongs to each gated model, independent of how models
    // are grouped into sections. A gated model with no `upsell` has nowhere to
    // send the user, so that row shows but stays inert.
    const upsellByModelId = new Map(
        allModels.filter((model) => !model.isAvailable && model.upsell).map((model) => [model.id, model.upsell]),
    );
    const hasGatedModelsAt = sections.map((section) => section.items.some((model) => !model.isAvailable));
    const enabledModelIndices = allModels.reduce(
        /**
         * @param {number[]} indices
         * @param {import('../../../../../types/new-tab.js').AIModelItem} model
         * @param {number} index
         */
        (indices, model, index) => {
            if (model.isAvailable || upsellByModelId.has(model.id)) indices.push(index);
            return indices;
        },
        [],
    );

    const getInitialActiveIndex = () => {
        if (enabledModelIndices.length === 0) return -1;

        const selectedIndex = selectedModelId ? allModels.findIndex((model) => model.id === selectedModelId && model.isAvailable) : -1;
        if (selectedIndex >= 0) return selectedIndex;

        // Prefer the first *available* model over a gated upsell row, so opening
        // the dropdown never pre-highlights a row whose Enter navigates away.
        const firstAvailableIndex = allModels.findIndex((model) => model.isAvailable);
        return firstAvailableIndex >= 0 ? firstAvailableIndex : enabledModelIndices[0];
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
                if (activeIndex < 0 || activeIndex >= allModels.length) break;
                {
                    const model = allModels[activeIndex];
                    const upsell = upsellByModelId.get(model.id);
                    if (model.isAvailable) {
                        onSelect(model.id);
                        onClose({ restoreFocus: true });
                    } else if (upsell) {
                        activateUpsell(upsell, true);
                    }
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
                // A section containing gated models always needs the divider separating
                // it from the section above, even when the client sends no header text.
                // Never show it above the very first section.
                const needsDivider = sectionIndex > 0 && (Boolean(section.header) || hasGatedModelsAt[sectionIndex]);
                const gatedSectionDescriptionId = section.header ? `model-gated-section-${sectionIndex}` : undefined;
                return (
                    <Fragment key={sectionIndex}>
                        {needsDivider && <DropdownSeparator />}
                        {section.header && (
                            <DropdownSectionHeader descriptionId={gatedSectionDescriptionId}>{section.header}</DropdownSectionHeader>
                        )}
                        {section.items.map((model) => {
                            const Icon = getModelIcon(model.id);
                            const optionIndex = optionIndexById.get(model.id) ?? -1;
                            const badgeLabel = getRowBadgeLabel(model, t);
                            const rowUpsell = upsellByModelId.get(model.id);
                            const isUpsellRow = !model.isAvailable && rowUpsell !== undefined;
                            const isInteractive = model.isAvailable || isUpsellRow;
                            return (
                                <li
                                    key={model.id}
                                    id={getOptionId(optionIndex)}
                                    role="option"
                                    aria-label={!model.isAvailable ? model.name : undefined}
                                    aria-selected={model.isAvailable ? model.id === selectedModelId : isUpsellRow ? false : undefined}
                                    aria-describedby={isUpsellRow ? gatedSectionDescriptionId : undefined}
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
                                                    activateUpsell(rowUpsell, false);
                                                }
                                              : undefined
                                    }
                                >
                                    {Icon && <Icon />}
                                    <div class={styles.modelOptionLabel}>
                                        <span class={styles.modelOptionName}>{model.isAvailable ? model.name : `${model.name}…`}</span>
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
