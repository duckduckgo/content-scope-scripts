import { Fragment, h } from 'preact';
import styles from './VPNInterface.module.css';
import { useTypedTranslationWith } from '../types.js';
import { useVisibility } from '../widget-list/widget-config.provider.js';
import { useCustomizer } from '../customizer/components/CustomizerMenu.js';
import { VpnContext, VpnProvider } from './VpnProvider.js';
import { useContext, useId, useEffect, useState } from 'preact/hooks';
import { VpnHeading } from '../privacy-stats/components/VpnHeading.js';
import { Arrow, ConnectionLongest, ConnectionTime, Ip, Volume } from './Icons.js';

/**
 * @import enStrings from "./strings.json"
 * @typedef {enStrings} Strings
 * @typedef {import('../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../types/new-tab').VPNWidgetData} VPNWidgetData
 */

/**
 * @param {object} props
 * @param {import('../../types/new-tab').Expansion} props.expansion
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
            {expansion === 'expanded' && <VpnBody data={data} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {VPNWidgetData} props.data
 */
function VpnBody({ data }) {
    return (
        <div class={styles.body}>
            <ul class={styles.list}>
                {data.state !== 'disconnected' && (
                    <li>
                        <ConnectionTimeItem timestamp={data.value?.session.connectedSince} />
                    </li>
                )}
                <li>
                    <LongestConnection timespan={data.value?.history.longestConnection} />
                </li>
                {data.state !== 'disconnected' && (
                    <Fragment>
                        <li>
                            <IpItem ip={data.value?.session.currentIp} />
                        </li>
                        <li>
                            <DataVolume dataVolume={data.value?.session.dataVolume} />
                        </li>
                    </Fragment>
                )}
            </ul>
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
        </Item>
    );
}

/**
 * @param {object} props
 * @param {import('../../types/new-tab').Timespan|undefined} props.timespan
 */
function LongestConnection({ timespan }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const display = timespan ? [timespan.weeks, timespan.days, timespan.hours, timespan.minutes] : undefined;
    return (
        <Item icon={<ConnectionLongest />}>
            <span class={styles.label}>{t('vpn_longestConnectionLabel')}</span>
            {timespan && display && (
                <span class={styles.value}>
                    {display.map((item, index) => {
                        if (item === 0) return null;
                        const lookup = ['w', 'd', 'h', 'm'];
                        return item !== undefined ? <span>{item + lookup[index]}</span> : null;
                    })}
                </span>
            )}
        </Item>
    );
}

/**
 * @param {object} props
 * @param {number|undefined} props.timestamp
 */
function ConnectionTimeItem({ timestamp }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [connectedDisplay, setConnectedDisplay] = useState(() => (timestamp ? formatDuration(timestamp) : null));
    useEffect(() => {
        const interval = setInterval(() => {
            setConnectedDisplay(formatDuration(timestamp));
        }, 1000);

        return () => clearInterval(interval);
    }, [timestamp]);
    return (
        <Item icon={<ConnectionTime />}>
            <span class={styles.label}>{t('vpn_connectionTimeLabel')}</span>
            {timestamp !== undefined && connectedDisplay !== null && <span class={styles.value}>{formatDuration(timestamp)}</span>}
        </Item>
    );
}

/**
 * @param {object} props
 * @param {import('../../types/new-tab').DataVolumeMetrics|undefined} props.dataVolume
 */
function DataVolume({ dataVolume }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    return (
        <Item icon={<Volume />}>
            <span class={styles.label}>{t('vpn_dataVolumeLabel')}</span>
            {dataVolume && (
                <span class={styles.value}>
                    <Arrow />
                    {dataVolume.upload} {dataVolume.unit}
                    <Arrow />
                    {dataVolume.download} {dataVolume.unit}
                </span>
            )}
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

    useCustomizer({ title: sectionTitle, id, icon: 'shield', toggle, visibility: visibility.value, index });

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
        console.log('VPN is ready, has data: ', state.data);
        return <Vpn expansion={state.config.expansion} data={state.data} toggle={toggle} />;
    }
    return null;
}

function formatDuration(from) {
    if (!Number.isFinite(from) || from < 0) {
        throw new Error('Invalid timestamp');
    }

    const now = Date.now();
    const duration = Math.max(0, Math.floor((now - from) / 1000));

    const days = Math.floor(duration / 86400);
    const hours = Math.floor((duration % 86400) / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0m';
}
