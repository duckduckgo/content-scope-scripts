import { h } from 'preact';
import styles from './DockInstructions.module.css';

/**
 * Placeholder overlay content showing instructions for adding the app to the Dock.
 * Displayed when the user clicks "Show Me How" on the dock-instructions row.
 */
export function DockInstructions() {
    return (
        <div className={styles.root}>
            <h3 className={styles.title}>Add DuckDuckGo to your Dock</h3>
            <ol className={styles.steps}>
                <li>Right-click the DuckDuckGo icon in the Dock</li>
                <li>Select Options</li>
                <li>Click Keep in Dock</li>
            </ol>
        </div>
    );
}
