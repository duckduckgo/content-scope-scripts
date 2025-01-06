import cn from 'classnames';
import styles from './CustomizerDrawerInner.module.css';
import { h } from 'preact';
import { useMessaging } from '../../types.js';
import { Open } from '../../components/icons/Open.js';

export function SettingsLink() {
    const messaging = useMessaging();
    function onClick(e) {
        e.preventDefault();
        messaging.open({ target: 'settings' });
    }
    return (
        <a href="duck://settings" class={cn(styles.settingsLink)} onClick={onClick}>
            <span>Go to Settings</span>
            <Open />
        </a>
    );
}
