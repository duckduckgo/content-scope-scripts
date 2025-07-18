import cn from 'classnames';
import styles from './CustomizerDrawerInner.module.css';
import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {import('preact').ComponentChild} props.icon
 * @param {() => void} props.onClick
 */
export function SettingsLink({ title, icon, onClick }) {
    return (
        <a
            href="duck://settings"
            class={cn(styles.settingsLink)}
            onClick={(event) => {
                event.preventDefault();
                onClick();
            }}
        >
            <span>{title}</span>
            {icon}
        </a>
    );
}
