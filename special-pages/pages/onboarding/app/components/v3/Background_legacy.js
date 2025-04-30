import { h } from 'preact';
import styles from './Background_legacy.module.css';
import cn from 'classnames';

export function BackgroundLegacy() {
    return (
        <div className={styles.background}>
            <div className={cn(styles.foreground, styles.layer1)} />
            <div className={cn(styles.foreground, styles.layer2)} />
            <div className={cn(styles.foreground, styles.layer3)} />
        </div>
    );
}
