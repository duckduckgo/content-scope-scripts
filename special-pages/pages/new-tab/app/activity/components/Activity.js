import { Fragment, h } from 'preact';
import styles from './Activity.module.css';
import { useContext, useId, useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import { ActivityApiContext, ActivityContext, ActivityProvider, SignalStateContext, SignalStateProvider } from '../ActivityProvider.js';
import { useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useDocumentVisibility } from '../../utils.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { usePlatformName } from '../../settings.provider.js';
import { Heading } from '../../privacy-stats/components/PrivacyStats.js';
import { Chevron } from '../../components/Icons.js';
import { CompanyIcon } from '../../components/CompanyIcon.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { ActivityItem } from './ActivityItem.js';
import { ActivityBurningSignalContext, BurnProvider } from '../BurnProvider.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { useComputed } from '@preact/signals';
import { ActivityItemAnimationWrapper } from './ActivityItemAnimationWrapper.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {import('../../../types/new-tab').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../types/new-tab').ActivityData} ActivityData
 * @typedef {import('../../../types/new-tab').ActivityConfig} ActivityConfig
 * @typedef {import('../../../types/new-tab').TrackingStatus} TrackingStatus
 * @typedef {import('../../../types/new-tab').HistoryEntry} HistoryEntry
 * @typedef {import("../ActivityProvider.js").Events} Events
 */

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {()=>void} props.toggle
 */
function ActivityConfigured({ expansion, toggle }) {
    const platformName = usePlatformName();
    const expanded = expansion === 'expanded';
    const { activity } = useContext(SignalStateContext);
    const count = useComputed(() => {
        return Object.values(activity.value.trackingStatus).reduce((acc, item) => {
            return acc + item.totalCount;
        }, 0);
    });
    const canExpand = useComputed(() => {
        return Object.keys(activity.value.items).length > 0;
    });

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();
    const canBurn = platformName === 'macos';

    return (
        <div class={styles.root}>
            <Heading
                recent={count.value}
                onToggle={toggle}
                expansion={expansion}
                canExpand={canExpand.value}
                buttonAttrs={{
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID,
                }}
            />
            {canExpand && expanded && <ActivityBody canBurn={canBurn} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.canBurn
 */
function ActivityBody({ canBurn }) {
    const { didClick } = useContext(ActivityApiContext);
    const documentVisibility = useDocumentVisibility();
    const { isReducedMotion } = useEnv();
    const { keys } = useContext(SignalStateContext);
    const { burning, exiting } = useContext(ActivityBurningSignalContext);
    const busy = useComputed(() => burning.value.length > 0 || exiting.value.length > 0);
    return (
        <ul class={styles.activity} onClick={didClick} data-busy={busy}>
            {keys.value.map((id, index) => {
                if (canBurn && !isReducedMotion) return <BurnableItem id={id} key={id} documentVisibility={documentVisibility} />;
                return <RemovableItem id={id} key={id} canBurn={canBurn} documentVisibility={documentVisibility} />;
            })}
        </ul>
    );
}

const BurnableItem = memo(
    /**
     * @param {object} props
     * @param {string} props.id
     * @param {"visible" | "hidden"} props.documentVisibility
     */
    function BurnableItem({ id, documentVisibility }) {
        const { activity } = useContext(SignalStateContext);
        const item = useComputed(() => activity.value.items[id]);
        return (
            <ActivityItemAnimationWrapper url={id}>
                <ActivityItem
                    title={item.value.title}
                    url={id}
                    favoriteSrc={item.value.favoriteSrc}
                    faviconMax={item.value.faviconMax}
                    etldPlusOne={item.value.etldPlusOne}
                    canBurn={true}
                    documentVisibility={documentVisibility}
                >
                    <TrackerStatus id={id} trackersFound={item.value.trackersFound} />
                    <HistoryItems id={id} />
                </ActivityItem>
            </ActivityItemAnimationWrapper>
        );
    },
);

const RemovableItem = memo(
    /**
     * @param {object} props
     * @param {string} props.id
     * @param {boolean} props.canBurn
     * @param {"visible" | "hidden"} props.documentVisibility
     */
    function RemovableItem({ id, canBurn, documentVisibility }) {
        const { activity } = useContext(SignalStateContext);
        const item = useComputed(() => activity.value.items[id]);
        return (
            <ActivityItem
                title={item.value.title}
                url={id}
                favoriteSrc={item.value.favoriteSrc}
                faviconMax={item.value.faviconMax}
                etldPlusOne={item.value.etldPlusOne}
                canBurn={canBurn}
                documentVisibility={documentVisibility}
            >
                <TrackerStatus id={id} trackersFound={item.value.trackersFound} />
                <HistoryItems id={id} />
            </ActivityItem>
        );
    },
);

const DDG_MAX_TRACKER_ICONS = 3;
/**
 * @param {object} props
 * @param {string} props.id
 * @param {boolean} props.trackersFound
 */
function TrackerStatus({ id, trackersFound }) {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const { activity } = useContext(SignalStateContext);
    const status = useComputed(() => activity.value.trackingStatus[id]);
    const other = status.value.trackerCompanies.length - DDG_MAX_TRACKER_ICONS;
    // const { env } = useEnv();
    // if (env === 'development') {
    //     console.groupCollapsed(`trackingStatus ${id}`);
    //     console.log('    [total]', status.value.totalCount);
    //     console.log('[companies]', status.value.trackerCompanies);
    //     console.groupEnd();
    // }

    const companyIconsMax = other === 0 ? DDG_MAX_TRACKER_ICONS : DDG_MAX_TRACKER_ICONS - 1;
    const icons = status.value.trackerCompanies.slice(0, companyIconsMax).map((item, index) => {
        return <CompanyIcon displayName={item.displayName} key={item} />;
    });

    const otherIcon = other > 0 ? <span class={styles.otherIcon}>+{other + 1}</span> : null;

    if (status.value.totalCount === 0) {
        if (trackersFound) return <p>{t('activity_no_trackers_blocked')}</p>;
        return <p>{t('activity_no_trackers')}</p>;
    }

    return (
        <div class={styles.companiesIconRow} data-testid="TrackerStatus">
            <div class={styles.companiesIcons}>
                {icons}
                {otherIcon}
            </div>
            <div class={styles.companiesText}>
                <Trans str={t('activity_countBlockedPlural', { count: String(status.value.totalCount) })} values={{}} />
            </div>
        </div>
    );
}

const MIN_SHOW_AMOUNT = 2;
const MAX_SHOW_AMOUNT = 10;
// const HistoryItems = memo(HistoryItems_);
/**
 * @param {object} props
 * @param {string} props.id
 */
function HistoryItems({ id }) {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const { activity } = useContext(SignalStateContext);
    const history = useComputed(() => activity.value.history[id]);
    const [expansion, setExpansion] = useState(/** @type {Expansion} */ ('collapsed'));
    const max = Math.min(history.value.length, MAX_SHOW_AMOUNT);
    const min = Math.min(MIN_SHOW_AMOUNT, max);
    const current = expansion === 'collapsed' ? min : max;
    const hasMore = current < max;
    const hasLess = current > min;
    const hiddenCount = max - current;
    const showButton = hasMore || hasLess;

    function onClick(event) {
        const btn = event.target?.closest('button[data-action]');
        if (btn?.dataset.action === 'hide') {
            setExpansion('collapsed');
        } else if (btn?.dataset.action === 'show') {
            setExpansion('expanded');
        }
    }

    return (
        <Fragment>
            <ul class={styles.history} onClick={onClick}>
                {history.value.slice(0, current).map((item, index) => {
                    const isLast = index === current - 1;
                    return (
                        <li class={styles.historyItem} key={item.url + item.title}>
                            <a href={item.url} class={styles.historyLink} title={item.url} data-url={item.url}>
                                {item.title}
                            </a>
                            <small class={styles.time}>{item.relativeTime}</small>
                            {isLast && showButton && (
                                <button
                                    data-action={hasMore && isLast ? 'show' : 'hide'}
                                    class={styles.historyBtn}
                                    aria-label={
                                        hasMore && isLast
                                            ? t('activity_show_more_history', { count: String(hiddenCount) })
                                            : t('activity_show_less_history')
                                    }
                                >
                                    <Chevron />
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </Fragment>
    );
}

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function ActivityCustomized() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const platformName = usePlatformName();

    /**
     * The menu title for the stats widget is changes when the menu is in the sidebar.
     */
    // prettier-ignore
    const sectionTitle = t('activity_menuTitle');

    const { visibility, id, toggle, index } = useVisibility();

    useCustomizer({ title: sectionTitle, id, icon: 'shield', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <ActivityProvider>
            {platformName === 'macos' && (
                <BurnProvider>
                    <ActivityConsumer />
                </BurnProvider>
            )}
            {platformName === 'windows' && <ActivityConsumer />}
        </ActivityProvider>
    );
}

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <ActivityProvider>
 *     <ActivityConsumer />
 * </ActivityProvider>
 * ```
 */
export function ActivityConsumer() {
    const { state, toggle } = useContext(ActivityContext);
    if (state.status === 'ready') {
        return (
            <SignalStateProvider>
                <ActivityConfigured expansion={state.config.expansion} toggle={toggle} />
            </SignalStateProvider>
        );
    }
    return null;
}
