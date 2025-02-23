import { h } from 'preact';
import styles from './Vpn.module.css';
import { useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { VpnContext, VpnProvider } from '../VpnProvider.js';
import { useContext, useEffect, useId, useState } from 'preact/hooks';
import { VpnHeading } from '../../privacy-stats/components/VpnHeading.js';
import { Arrow, ConnectionLongest, ConnectionTime, Ip, Volume } from '../Icons.js';
import { Usage } from './Usage.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {enStrings} Strings
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').VPNWidgetData} VPNWidgetData
 * @typedef {import('../../../types/new-tab.js').VPNConnected} VPNConnected
 * @typedef {import('../../../types/new-tab.js').VPNDisconnected} VPNDisconnected
 */

/**
 * @param {object} props
 * @param {import('../../../types/new-tab.js').Expansion} props.expansion
 * @param {VPNWidgetData} props.data
 * @param {()=>void} props.toggle
 */
export function Vpn({ data, expansion, toggle }) {
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();
    return (
        <div class={styles.root}>
            <VpnHeading
                expansion={expansion}
                onToggle={toggle}
                data={data}
                canExpand={true}
                buttonAttrs={{
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID,
                }}
            />
            {expansion === 'expanded' && data.state !== 'unsubscribed' && <VpnBody data={data} />}
            {expansion === 'expanded' && data.state === 'unsubscribed' && <EmptyVpnBody />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {VPNConnected | VPNDisconnected} props.data
 */
function VpnBody({ data }) {
    const connectedTime = data.state === 'connected' ? data.value.session.connectedSince : undefined;
    const ip = data.state === 'connected' ? data.value.session.currentIp : undefined;
    const volume = data.state === 'connected' ? data.value.session.dataVolume : undefined;
    return (
        <div class={styles.body}>
            <ul class={styles.list}>
                <li>
                    <ConnectionTimeItem timestamp={connectedTime} key={connectedTime} />
                </li>
                <li>
                    <LongestConnection longest={data.value.history.longestConnection} />
                </li>
                <li>
                    <IpItem ip={ip} />
                </li>
                <li>
                    <DataVolume dataVolume={volume} />
                </li>
            </ul>
            <Usage usage={data.value.history.weeklyUsage} state={data.state} />
        </div>
    );
}

/**
 */
function EmptyVpnBody() {
    return (
        <div class={styles.body}>
            <ul class={styles.list}>
                <li>
                    <ConnectionTimeItem timestamp={undefined} />
                </li>
                <li>
                    <LongestConnection longest={undefined} />
                </li>
                <li>
                    <IpItem ip={undefined} />
                </li>
                <li>
                    <DataVolume dataVolume={undefined} />
                </li>
            </ul>
            <Usage
                state={'unsubscribed'}
                usage={{
                    days: [
                        { day: 'Sun', value: 0, active: false },
                        { day: 'Mon', value: 0, active: false },
                        { day: 'Tue', value: 0, active: false },
                        { day: 'Wed', value: 0, active: false },
                        { day: 'Thu', value: 0, active: false },
                        { day: 'Fri', value: 0, active: false },
                        { day: 'Sat', value: 0, active: false },
                    ],
                    maxValue: 24,
                    timeUnit: 'hours',
                }}
            />
        </div>
    );
}

/**
 * @param {object} props
 * @param {string|undefined} props.ip
 */
function IpItem({ ip }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <Item icon={<Ip />}>
            <span class={styles.label}>{t('vpn_ipLabel')}</span>
            {ip && <span className={styles.value}>{ip}</span>}
            {!ip && <span className={styles.value}>-.-.-.-</span>}
        </Item>
    );
}

/**
 * @param {object} props
 * @param {import('../../../types/new-tab.js').Timespan|undefined} props.longest
 */
function LongestConnection({ longest }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const display = longest ? [longest.weeks, longest.days, longest.hours, longest.minutes] : undefined;
    const allZero = display?.every((x) => x === 0);
    let segments;
    if (display && !allZero) {
        segments = (
            <span className={styles.value}>
                {display.map((item, index) => {
                    const lookup = ['w', 'd', 'h', 'm'];
                    return item !== undefined ? <span>{item + lookup[index]}</span> : null;
                })}
            </span>
        );
    } else {
        segments = <span class={styles.value}>0h 0m 0s</span>;
    }
    return (
        <Item icon={<ConnectionLongest />}>
            <span class={styles.label}>{t('vpn_longestConnectionLabel')}</span>
            {segments}
        </Item>
    );
}

/**
 * @param {object} props
 * @param {number|undefined} props.timestamp
 */
function ConnectionTimeItem({ timestamp }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const timer = useTimer(timestamp);
    return (
        <Item icon={<ConnectionTime />}>
            <span class={styles.label}>{t('vpn_connectionTimeLabel')}</span>
            {timestamp !== undefined && timer !== null && <span class={styles.value}>{timer}</span>}
            {timestamp === undefined && <span class={styles.value}>0h 0m 0s</span>}
        </Item>
    );
}

/**
 * @param {number|undefined} timestamp
 * @return {string|null}
 */
function useTimer(timestamp) {
    const [connectedDisplay, setConnectedDisplay] = useState(() => formatDuration(timestamp));
    useEffect(() => {
        if (timestamp === undefined) return;
        const interval = setInterval(() => {
            setConnectedDisplay(formatDuration(timestamp));
        }, 1000);

        return () => clearInterval(interval);
    }, [timestamp]);
    return connectedDisplay;
}

/**
 * @param {object} props
 * @param {import('../../../types/new-tab.js').DataVolumeMetrics|undefined} props.dataVolume
 */
function DataVolume({ dataVolume }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const upload = dataVolume?.upload ?? 0;
    const download = dataVolume?.download ?? 0;
    const unit = dataVolume?.unit || 'mb/s';
    return (
        <Item icon={<Volume />}>
            <span class={styles.label}>{t('vpn_dataVolumeLabel')}</span>
            <span class={styles.value}>
                <Arrow />
                {download} {unit}
                <Arrow />
                {upload} {unit}
            </span>
        </Item>
    );
}

function Item({ children, icon }) {
    return (
        <div class={styles.item}>
            <div class={styles.icon}>{icon}</div>
            <div class={styles.itemBody}>{children}</div>
        </div>
    );
}

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function VpnCustomized() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    /**
     * The menu title for the stats widget is changes when the menu is in the sidebar.
     */
    const sectionTitle = t('vpn_menuTitle');

    const { visibility, id, toggle, index } = useVisibility();

    useCustomizer({ title: sectionTitle, id, icon: 'globe', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <VpnProvider>
            <VpnConsumer />
        </VpnProvider>
    );
}

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <PrivacyStatsProvider>
 *     <PrivacyStatsConsumer />
 * </PrivacyStatsProvider>
 * ```
 */
export function VpnConsumer() {
    const { state, toggle } = useContext(VpnContext);
    if (state.status === 'ready') {
        console.log('VPN:', state.data.state, state.data.pending);
        return <Vpn expansion={state.config.expansion} data={state.data} toggle={toggle} />;
    }
    return null;
}

function formatDuration(from) {
    if (!Number.isFinite(from) || from < 0) {
        return `0h 0m 0s`;
    }

    const now = Date.now();
    const duration = Math.max(0, Math.floor((now - from) / 1000));

    const days = Math.floor(duration / 86400);
    const hours = Math.floor((duration % 86400) / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}
