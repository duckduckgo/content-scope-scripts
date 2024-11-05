import { h } from 'preact';
import styles from './App.module.css';
import { usePlatformName } from '../settings.provider.js';
import { WidgetList } from '../widget-list/WidgetList.js';

/**
 * Renders the App component.
 *
 * @param {Object} props - The properties of the component.
 * @param {import("preact").ComponentChild} [props.children] - The child components to be rendered within the App component.
 */
export function App({ children }) {
    const platformName = usePlatformName();
    return (
        <div className={styles.layout} data-platform={platformName}>
            <WidgetList />
            {children}
        </div>
    );
}
