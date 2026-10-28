import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { useEnv } from '../../../../../../shared/components/EnvironmentProvider.js';
import { useTypedTranslationWith } from '../../../types';
import { ChevronLeftMediumIcon, ChevronRightMediumIcon } from './SuggestedPromptsIcons.js';
import { HOW_DUCKAI_WORKS_CARDS, IMAGE_PROMPTS, TEXT_PROMPT_PAGES } from './suggestedPrompts.data.js';
import styles from './SuggestedPrompts.module.css';

/**
 * @typedef {typeof import('../../strings.json')} Strings
 * @typedef {import('./suggestedPrompts.data.js').Prompt} Prompt
 * @typedef {import('./useSuggestedPromptTabs.js').SwapDirection} SwapDirection
 */

/**
 * Chromium also fires `auxclick` for a right-click, which must not send a prompt; only middle-click opens a new tab.
 * @param {(event: MouseEvent) => void} handler
 * @returns {(event: MouseEvent) => void}
 */
export const onMiddleClick = (handler) => (event) => {
    if (event.button === 1) handler(event);
};

/**
 * The message a text prompt sends to Duck.ai, also previewed in the composer while the prompt is hovered or focused.
 * @param {ReturnType<typeof useTypedTranslationWith<Strings>>['t']} t
 * @param {import('./suggestedPrompts.data.js').TextPrompt} prompt
 */
export const textPromptChat = (t, prompt) => t('omnibar_suggestedPromptsTextPromptTemplate', { topic: t(prompt.label) });

export function HowDuckAiWorksPanel() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <div class={styles.howItWorks}>
            <ul class={styles.howItWorksGrid}>
                {HOW_DUCKAI_WORKS_CARDS.map((card) => (
                    <li key={card.title} class={styles.howItWorksCard}>
                        <img src={card.icon} alt="" aria-hidden="true" class={styles.pictogram} />
                        <h3 class={styles.howItWorksTitle}>{t(card.title)}</h3>
                        <p class={styles.howItWorksBody}>{t(card.body)}</p>
                    </li>
                ))}
            </ul>
            <div class={styles.divider} aria-hidden="true" />
            <p class={styles.banner}>
                <img src="./suggested-prompts/dax.svg" alt="" aria-hidden="true" class={styles.bannerLogo} />
                {t('omnibar_suggestedPromptsBanner')}
            </p>
        </div>
    );
}

/**
 * @param {object} props
 * @param {(prompt: Prompt, event: MouseEvent) => void} props.onSelect
 * @param {(text: string|null) => void} [props.onPreview]
 */
export function TextPromptsPanel({ onSelect, onPreview }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { isReducedMotion } = useEnv();
    // A panel closing under the pointer or focus gets no mouseleave or blur, so clear the preview here too.
    useEffect(() => () => onPreview?.(null), [onPreview]);
    const [pageIndex, setPageIndex] = useState(0);
    /** Previous page sliding out while the new one slides in. */
    const [swap, setSwap] = useState(/** @type {{ pageIndex: number, direction: SwapDirection } | null} */ (null));
    const prompts = TEXT_PROMPT_PAGES[pageIndex];

    /** @param {number} delta */
    const goToPage = (delta) => {
        if (!isReducedMotion) setSwap({ pageIndex, direction: delta > 0 ? 'right' : 'left' });
        setPageIndex(pageIndex + delta);
    };

    /**
     * @param {import('./suggestedPrompts.data.js').TextPrompt[]} pagePrompts
     * @param {boolean} entering
     */
    const renderItems = (pagePrompts, entering) =>
        pagePrompts.map((prompt, index) => (
            <li key={prompt.id} class={cn(entering && styles.textItemEntering)} style={entering ? { '--i': index } : undefined}>
                <button
                    type="button"
                    class={styles.textPrompt}
                    onClick={(event) => onSelect(prompt, event)}
                    onAuxClick={onMiddleClick((event) => onSelect(prompt, event))}
                    onMouseEnter={() => onPreview?.(textPromptChat(t, prompt))}
                    onMouseLeave={() => onPreview?.(null)}
                    onFocus={() => onPreview?.(textPromptChat(t, prompt))}
                    onBlur={() => onPreview?.(null)}
                >
                    <prompt.Icon class={styles.textPromptIcon} aria-hidden="true" />
                    <span>{t(prompt.label)}</span>
                </button>
            </li>
        ));

    return (
        <div class={styles.textPanel}>
            <div class={styles.listSlot}>
                <ul
                    key={pageIndex}
                    class={cn(styles.textList, swap && styles.textListEntering, swap?.direction === 'left' && styles.textListEnteringLeft)}
                >
                    {renderItems(prompts, swap !== null)}
                </ul>
                {swap && (
                    <ul
                        key={`exiting-${swap.pageIndex}`}
                        aria-hidden="true"
                        inert
                        class={cn(styles.textList, styles.textListExiting, swap.direction === 'left' && styles.textListExitingRight)}
                        onAnimationEnd={(event) => event.target === event.currentTarget && setSwap(null)}
                    >
                        {renderItems(TEXT_PROMPT_PAGES[swap.pageIndex], false)}
                    </ul>
                )}
            </div>
            <div class={styles.pagination}>
                <button
                    type="button"
                    class={styles.pageButton}
                    disabled={pageIndex === 0}
                    aria-label={t('omnibar_suggestedPromptsPrevPageAria')}
                    onClick={() => goToPage(-1)}
                >
                    <ChevronLeftMediumIcon aria-hidden="true" />
                </button>
                <button
                    type="button"
                    class={styles.pageButton}
                    disabled={pageIndex === TEXT_PROMPT_PAGES.length - 1}
                    aria-label={t('omnibar_suggestedPromptsNextPageAria')}
                    onClick={() => goToPage(1)}
                >
                    <ChevronRightMediumIcon aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/**
 * @param {object} props
 * @param {(prompt: Prompt, event: MouseEvent) => void} props.onSelect
 */
export function ImagePromptsPanel({ onSelect }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <ul class={styles.imageRow}>
            {IMAGE_PROMPTS.map((prompt) => (
                <li key={prompt.id} class={styles.imageItem}>
                    <button
                        type="button"
                        class={styles.imageButton}
                        aria-label={t(prompt.label)}
                        onClick={(event) => onSelect(prompt, event)}
                        onAuxClick={prompt.mode === 'send' ? onMiddleClick((event) => onSelect(prompt, event)) : undefined}
                    >
                        <img src={prompt.hoverImage} alt="" aria-hidden="true" class={styles.image} />
                        <img src={prompt.image} alt="" aria-hidden="true" class={cn(styles.image, styles.imageDefault)} />
                        <span class={styles.imageChip}>{t(prompt.label)}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
