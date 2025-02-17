import { useTypedTranslationWith } from '../../types.js';
import { useEffect, useState } from 'preact/hooks';
import styles from './PrivacyStats.module.css';
import { ShowHideButton } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';
import { Switch } from '../../../../../shared/components/Switch/Switch.js';
import { useVpnApi } from '../../vpn/VpnProvider.js';

/**
 * @import vpnStrings from "../../vpn/strings.json"
 * @param {object} props
 * @param {import('../../../types/new-tab.js').VPNWidgetData} props.data
 * @param {import('../../../types/new-tab.js').Expansion} props.expansion
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import('preact').ComponentProps<'button'>} [props.buttonAttrs]
 */
export function VpnHeading({ data, expansion, canExpand, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {vpnStrings} */ ({}));
    const { disconnect, connect, tryForFree } = useVpnApi();
    const title = (() => {
        switch (data.state) {
            case 'connected':
                return t('vpn_connectedTitle');
            case 'disconnected':
                return t('vpn_disconnectedTitle');
            case 'unsubscribed':
                return t('vpn_disabled');
        }
    })();

    let checked = false;
    if (data.state === 'connected' && data.pending !== 'disconnecting') {
        checked = true;
    }
    if (data.state === 'disconnected' && data.pending === 'connecting') {
        checked = true;
    }
    return (
        <div className={cn(styles.heading, styles.activityVariant, styles.vpn)} data-testid={'VpnHeading'}>
            <span className={styles.headingIcon}>
                <img src="./icons/vpn.svg" alt="" />
            </span>
            <h2 className={styles.title}>
                {title}
                {data.state === 'unsubscribed' && <small>{t('vpn_disabledSubtitle')}</small>}
            </h2>
            <div class={styles.inlineControls}>
                {data.state === 'unsubscribed' && (
                    <button class={styles.inlineBtn} onClick={tryForFree}>
                        {t('vpn_tryButton')}
                    </button>
                )}
                {data.state !== 'unsubscribed' && (
                    <div class={styles.inlineSwitch} data-state={data.state} data-pending={data.pending}>
                        <ConnectedDot />
                        {data.state === 'connected' && data.pending === 'none' && (
                            <ConnectedText connectedSince={data.value.session.connectedSince} />
                        )}
                        {data.state === 'disconnected' && data.pending === 'none' && 'Not Connected'}
                        {data.state === 'connected' && data.pending === 'disconnecting' && 'Disconnecting...'}
                        {data.state === 'disconnected' && data.pending === 'connecting' && 'Connecting...'}
                        <Switch
                            pending={data.pending !== 'none'}
                            ariaLabel={''}
                            checked={checked}
                            onChecked={connect}
                            onUnchecked={disconnect}
                            platformName={'windows'}
                            theme={'light'}
                        />
                    </div>
                )}
            </div>
            {canExpand && (
                <span className={styles.widgetExpander}>
                    <ShowHideButton
                        buttonAttrs={{
                            ...buttonAttrs,
                            'aria-expanded': expansion === 'expanded',
                            'aria-pressed': expansion === 'expanded',
                        }}
                        onClick={onToggle}
                        text={expansion === 'expanded' ? t('vpn_hideLabel') : t('vpn_toggleLabel')}
                        shape="round"
                    />
                </span>
            )}
        </div>
    );
}

/**
 * @param {number} from - unix timestamp
 * @param {Intl.DateTimeFormat} formatter
 * @returns {string}
 */
function calculateConnectedDisplay(from, formatter) {
    if (!Number.isFinite(from) || from < 0) {
        throw new Error('Invalid timestamp');
    }

    const now = Date.now();
    const duration = Math.max(0, Math.floor((now - from) / 1000));

    // Create a Date object with the duration in milliseconds
    const date = new Date(duration * 1000);

    return formatter.format(date);
}

/**
 * @param {object} props
 * @param {number} props.connectedSince - unix timestamp representing when the connection started
 */
function ConnectedText({ connectedSince }) {
    const [formatter] = useState(
        () =>
            new Intl.DateTimeFormat('en', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'UTC', // Use UTC to avoid timezone offsets
            }),
    );
    const [connectedDisplay, setConnectedDisplay] = useState(() => calculateConnectedDisplay(connectedSince, formatter));

    useEffect(() => {
        const interval = setInterval(() => {
            setConnectedDisplay(calculateConnectedDisplay(connectedSince, formatter));
        }, 1000);

        return () => clearInterval(interval);
    }, [connectedSince, formatter]);

    return (
        <div class={styles.connectionStatus}>
            Connected · <time>{connectedDisplay}</time>
        </div>
    );
}

function ConnectedDot() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none">
            <circle cx="4" cy="4" r="4" fill="currentColor" />
        </svg>
    );
}
