import { h } from 'preact';
import cn from 'classnames';
import styles from './Title.module.css';

/**
 * Shared heading for step bubble content.
 *
 * @param {object} props
 * @param {string} [props.class]
 * @param {import('preact').Ref<HTMLHeadingElement>} [props.titleRef]
 * @param {import('preact').ComponentChildren} props.children
 */
export function Title({ class: className, titleRef, children }) {
    return (
        <h2 ref={titleRef} class={cn(styles.title, className)}>
            {children}
        </h2>
    );
}
