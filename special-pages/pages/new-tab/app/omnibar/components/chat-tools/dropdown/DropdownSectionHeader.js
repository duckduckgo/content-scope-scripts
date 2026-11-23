import { h } from 'preact';
import styles from './Dropdown.module.css';

/**
 * Group heading with an optional action. The heading itself is not navigable.
 *
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 * @param {string} [props.descriptionId] - Stable id for options that use this native-provided copy as their accessible description.
 * @param {string} [props.actionLabel] - Localized label for the optional action.
 * @param {() => void} [props.onAction] - Activates the optional action.
 * @returns {import('preact').VNode}
 */
export function DropdownSectionHeader({ children, descriptionId, actionLabel, onAction }) {
    return (
        <li id={descriptionId} role="presentation" class={styles.sectionHeader}>
            <span>{children}</span>
            {actionLabel && onAction && (
                <button
                    type="button"
                    class={styles.sectionAction}
                    onClick={(event) => {
                        event.stopPropagation();
                        onAction();
                    }}
                >
                    {actionLabel}
                </button>
            )}
        </li>
    );
}
