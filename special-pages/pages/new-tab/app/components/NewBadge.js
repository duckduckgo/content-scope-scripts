import { h } from 'preact';
import styles from './NewBadge.module.css';
import { useTypedTranslationWith } from '../types.js';

/**
 * @typedef {import('../strings.json')} Strings
 */

/**
 * Badge component that displays "NEW" text in a yellow rounded rectangle.
 */
export function NewBadge() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return <span class={styles.badge}>{t('newBadge')}</span>;
}
