import { h } from 'preact';
import styles from './Elements.module.css';
import { usePlatformName, useTranslation } from '../types.js';
import { useSettingsServiceDispatch } from '../global/Providers/SettingsServiceProvider.js';
import { eventToTarget } from '../../../../shared/handlers.js';

/**
 * Props for the Text component
 * @typedef {Object} LinkRowDefinition
 * @property {string} text - The content to display
 */

/**
 * A component that renders text with a specified CSS class
 * @param {LinkRowDefinition & { anchorAttrs: h.JSX.HTMLAttributes<HTMLAnchorElement>}} props - The component props
 */
export function LinkRow({ text, anchorAttrs }) {
    const { t } = useTranslation();
    return (
        <p class={styles.text}>
            <a class={styles.link} {...anchorAttrs}>
                {t(text)}
            </a>
        </p>
    );
}

/**
 * @param {LinkRowDefinition & { id: string }} props
 */
export function LinkRowWithState({ id, ...props }) {
    const d = useSettingsServiceDispatch();
    const platformName = usePlatformName();
    return (
        <LinkRow
            {...props}
            anchorAttrs={{
                onClick: (e) => {
                    e.preventDefault();
                    d({ kind: 'open-url', url: id, target: eventToTarget(e, platformName) });
                },
            }}
        />
    );
}
