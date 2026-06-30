import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslation } from '../../types';
import { Typed } from './Typed';
import { useTypingEffect } from '../../shared/components/SettingsProvider';
import { useGlobalDispatch, useGlobalState } from '../../global';
import { Button } from './Button';
import { Container } from './Container';
import { Title } from './Title';
import styles from './GetStartedContent.module.css';

/**
 * Bubble content for the getStarted step.
 * Renders title, body text, and CTA button.
 * Optionally renders a Chrome extension install checkbox when configured via step rows.
 *
 * @param {object} props
 * @param {() => void} props.advance
 * @param {() => void} props.onTitleComplete
 */
export function GetStartedContent({ advance, onTitleComplete }) {
    const { t } = useTypedTranslation();
    const hasTypingEffect = !!useTypingEffect();
    const { activeStepVisible, step } = useGlobalState();
    const dispatch = useGlobalDispatch();
    const [chromeExtensionChecked, setChromeExtensionChecked] = useState(false);

    const showChromeExtension = /** @type {import('../../types').GetStartedStep} */ (step).options?.includes('chrome-extension-install');

    const [title, body] = t('getStarted_title_v4', { newline: '\n' }).split('{paragraph}');

    function handleAdvance() {
        if (showChromeExtension && chromeExtensionChecked) {
            dispatch({ kind: 'request-chrome-extension' });
        }
        advance();
    }

    return (
        <Container class={styles.root}>
            <div class={styles.text}>
                <Title class={styles.title}>
                    {hasTypingEffect ? (
                        <Typed
                            text={title}
                            startDelay={800} // fade-in delay + duration + pause
                            onComplete={onTitleComplete}
                        />
                    ) : (
                        title
                    )}
                </Title>
                <p
                    class={cn(styles.body, {
                        [styles.revealable]: hasTypingEffect,
                        [styles.hidden]: hasTypingEffect && !activeStepVisible,
                    })}
                >
                    {body}
                </p>
            </div>
            <Button
                class={cn({ [styles.revealable]: hasTypingEffect, [styles.hidden]: hasTypingEffect && !activeStepVisible })}
                size="stretch"
                onClick={handleAdvance}
            >
                {t('getStartedButton_v4')}
            </Button>
            {showChromeExtension && (
                <ChromeExtensionCheckbox
                    class={cn({ [styles.revealable]: hasTypingEffect, [styles.hidden]: hasTypingEffect && !activeStepVisible })}
                    checked={chromeExtensionChecked}
                    onChange={setChromeExtensionChecked}
                    label={t('getStarted_chromeExtension_label')}
                    tooltip={t('getStarted_chromeExtension_tooltip')}
                />
            )}
        </Container>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.checked
 * @param {(checked: boolean) => void} props.onChange
 * @param {string} props.label
 * @param {string} props.tooltip
 * @param {string} [props.class]
 */
function ChromeExtensionCheckbox({ checked, onChange, label, tooltip, class: className }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div class={cn(styles.checkboxRow, className)}>
            <label class={styles.checkboxLabel}>
                <span class={cn(styles.checkbox, { [styles.checked]: checked })}>
                    <input
                        type="checkbox"
                        class={styles.checkboxInput}
                        checked={checked}
                        onChange={(e) => onChange(/** @type {HTMLInputElement} */ (e.target).checked)}
                    />
                    {checked && (
                        <svg class={styles.checkmark} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M2.5 6L5 8.5L9.5 3.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    )}
                </span>
                <span class={styles.checkboxText}>{label}</span>
            </label>
            <span class={styles.infoIconWrapper} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                <span class={styles.infoIcon} aria-label="More information">
                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                        <circle cx="8" cy="8" r="7" fill="currentColor" />
                        <path
                            d="M7.25 7h1.5v4h-1.5V7ZM8 4.5a.875.875 0 1 1 0 1.75.875.875 0 0 1 0-1.75Z"
                            fill="var(--ds-surface-tertiary, white)"
                        />
                    </svg>
                </span>
                {showTooltip && (
                    <span class={styles.tooltip} role="tooltip">
                        {tooltip}
                    </span>
                )}
            </span>
        </div>
    );
}
