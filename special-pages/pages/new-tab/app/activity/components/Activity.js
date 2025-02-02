import { Fragment, h } from 'preact';
import styles from './Activity.module.css';
import { useContext, useEffect, useId, useRef } from 'preact/hooks';
import { memo } from 'preact/compat';
import { ActivityApiContext, ActivityContext, ActivityProvider, SignalStateContext, SignalStateProvider } from '../ActivityProvider.js';
import { useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useOnMiddleClick } from '../../utils.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { useBatchedActivityApi, usePlatformName } from '../../settings.provider.js';
import { CompanyIcon } from '../../components/CompanyIcon.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { ActivityItem } from './ActivityItem.js';
import { ActivityBurningSignalContext, BurnProvider } from '../BurnProvider.js';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider.js';
import { useComputed } from '@preact/signals';
import { ActivityItemAnimationWrapper } from './ActivityItemAnimationWrapper.js';
import { useDocumentVisibility } from '../../../../../shared/components/DocumentVisibility.js';
import { ActivityHeading } from '../../privacy-stats/components/ActivityHeading.js';
import { HistoryItems } from './HistoryItems.js';

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
    const batched = useBatchedActivityApi();
    const expanded = expansion === 'expanded';
    const { activity } = useContext(SignalStateContext);
    const { didClick } = useContext(ActivityApiContext);
    const visibility = useDocumentVisibility();

    const ref = useRef(/** @type {HTMLUListElement|null} */ (null));
    useOnMiddleClick(ref, didClick);

    const count = useComputed(() => {
        return activity.value.totalTrackers;
    });

    const itemCount = useComputed(() => {
        return Object.keys(activity.value.items).length;
    });

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();
    const canBurn = platformName === 'macos';

    return (
        <Fragment>
            <div class={styles.root} onClick={didClick}>
                <ActivityHeading
                    trackerCount={count.value}
                    itemCount={itemCount.value}
                    onToggle={toggle}
                    expansion={expansion}
                    canExpand={itemCount.value > 0}
                    buttonAttrs={{
                        'aria-controls': WIDGET_ID,
                        id: TOGGLE_ID,
                    }}
                />
                {itemCount.value > 0 && expanded && <ActivityBody canBurn={canBurn} visibility={visibility} />}
            </div>
            {batched && itemCount.value > 0 && expanded && <Loader />}
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.canBurn
 * @param {DocumentVisibilityState} props.visibility
 */
function ActivityBody({ canBurn, visibility }) {
    const { isReducedMotion } = useEnv();
    const { keys } = useContext(SignalStateContext);
    const { burning, exiting } = useContext(ActivityBurningSignalContext);
    const busy = useComputed(() => burning.value.length > 0 || exiting.value.length > 0);

    return (
        <ul class={styles.activity} data-busy={busy}>
            {keys.value.map((id, index) => {
                if (canBurn && !isReducedMotion) return <BurnableItem id={id} key={id} documentVisibility={visibility} />;
                return <RemovableItem id={id} key={id} canBurn={canBurn} documentVisibility={visibility} />;
            })}
        </ul>
    );
}

function Loader() {
    const loaderRef = useRef(/** @type {HTMLDivElement|null} */ (null));

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                window.dispatchEvent(new Event('activity.next'));
            }
        });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, []);

    return (
        <div class={styles.loader} ref={loaderRef}>
            Loading...
        </div>
    );
}

const BurnableItem = memo(
    /**
     * @param {object} props
     * @param {string} props.id
     * @param {'visible' | 'hidden'} props.documentVisibility
     */
    function BurnableItem({ id, documentVisibility }) {
        const { activity } = useContext(SignalStateContext);
        const item = useComputed(() => activity.value.items[id]);
        if (!item.value) {
            return null;
        }
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
        if (!item.value) {
            return (
                <p data-testid="ActivityItem" data-state="loading" data-id={id} hidden>
                    Loading: {id}
                </p>
            );
        }
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
    const other = status.value.trackerCompanies.slice(DDG_MAX_TRACKER_ICONS - 1);
    // const { env } = useEnv();
    // if (env === 'development') {
    //     console.groupCollapsed(`trackingStatus ${id}`);
    //     console.log('    [total]', status.value.totalCount);
    //     console.log('[companies]', status.value.trackerCompanies);
    //     console.groupEnd();
    // }

    const companyIconsMax = other.length === 0 ? DDG_MAX_TRACKER_ICONS : DDG_MAX_TRACKER_ICONS - 1;

    const icons = status.value.trackerCompanies.slice(0, companyIconsMax).map((item, index) => {
        return <CompanyIcon displayName={item.displayName} key={item} />;
    });

    let otherIcon = null;
    if (other.length > 0) {
        const title = other.map((item) => item.displayName).join('\n');
        otherIcon = (
            <span title={title} class={styles.otherIcon}>
                +{other.length}
            </span>
        );
    }

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

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function ActivityCustomized() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));

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
            <ActivityConsumer />
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
    const platformName = usePlatformName();
    if (state.status === 'ready') {
        if (platformName === 'windows') {
            return (
                <SignalStateProvider>
                    <ActivityConfigured expansion={state.config.expansion} toggle={toggle} />
                </SignalStateProvider>
            );
        }
        return (
            <SignalStateProvider>
                <BurnProvider>
                    <ActivityConfigured expansion={state.config.expansion} toggle={toggle} />
                </BurnProvider>
            </SignalStateProvider>
        );
    }
    return null;
}
