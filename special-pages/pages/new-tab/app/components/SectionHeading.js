import { h } from 'preact';
import cn from 'classnames';
import styles from './SectionHeading.module.css';
import { ShowHideButton } from './ShowHideButton.jsx';

/**
 * Renders a section heading with a title and a show/hide button for expandable content.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.title - The title of the section heading.
 * @param {string} props.buttonLabel - The title of the section heading.
 * @param {'expanded'|'collapsed'} props.expansion - The current expansion state of the section heading, indicating whether it is expanded or collapsed.
 * @param {boolean} props.canExpand - Determines if the section can be expanded or collapsed.
 * @param {() => void} props.toggle - The function to toggle the expansion state.
 * @param {string} props.widgetId - The unique ID of the content controlled by the show/hide button.
 * @param {string} props.toggleId - The unique ID for the toggle button.
 */
export function SectionHeading({ title, buttonLabel, expansion, canExpand, toggle, widgetId, toggleId }) {
    return (
        <div
            className={cn(styles.root, {
                [styles.canExpand]: canExpand,
            })}
        >
            <h2 class={styles.title}>{title}</h2>
            <ShowHideButton
                buttonAttrs={{
                    'aria-expanded': expansion === 'expanded',
                    'aria-pressed': expansion === 'expanded',
                    'aria-controls': widgetId,
                    id: toggleId,
                }}
                text={buttonLabel}
                onClick={toggle}
            />
        </div>
    );
}
