import { h } from 'preact';
import cn from 'classnames';
import styles from './Container.module.css';

/**
 * Shared flex-column container for step bubble content.
 *
 * @param {object} props
 * @param {string} [props.class]
 * @param {import('preact').ComponentChildren} props.children
 */
export function Container({ class: className, children }) {
    return <div class={cn(styles.root, className)}>{children}</div>;
}
