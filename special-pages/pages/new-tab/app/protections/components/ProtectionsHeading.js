import { useTypedTranslationWith, useMessaging } from '../../types.js';
import styles from '../../privacy-stats/components/PrivacyStats.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';
import { InfoIcon } from '../../components/Icons.js';
import { NewBadge } from '../../components/NewBadge.js';
import { Tooltip } from '../../components/Tooltip/Tooltip.js';
import { useAnimatedCount } from '../utils/useAnimatedCount.js';
import { useRef, useEffect, useMemo } from 'preact/hooks';
import { getLocalizedNumberFormatter } from '../../../../../shared/utils.js';
import { useLocale } from '../../../../../shared/components/EnvironmentProvider.js';

/**
 * @import enStrings from "../strings.json"
 * @import statsStrings from "../../privacy-stats/strings.json"
 * @import activityStrings from "../../activity/strings.json"
 * @typedef {enStrings & statsStrings & activityStrings} Strings
 * @param {object} props
 * @param {import('../../../types/new-tab.ts').Expansion} props.expansion
 * @param {import("@preact/signals").Signal<number>} props.blockedCountSignal
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import('preact').ComponentProps<'button'>} [props.buttonAttrs]
 * @param {import("@preact/signals").Signal<undefined | number | null>} props.totalCookiePopUpsBlockedSignal
 * @param {boolean | undefined} [props.showProtectionsReportNewLabel]
 */
export function ProtectionsHeading({
    expansion,
    canExpand,
    blockedCountSignal,
    onToggle,
    buttonAttrs = {},
    totalCookiePopUpsBlockedSignal,
    showProtectionsReportNewLabel,
}) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const ntp = useMessaging();
    const locale = useLocale();
    const formatter = useMemo(() => getLocalizedNumberFormatter(locale), [locale]);
    const headingRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const counterContainerRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const totalTrackersBlocked = blockedCountSignal.value;
    const totalCookiePopUpsBlockedValue = totalCookiePopUpsBlockedSignal.value;

    // Defensive validation following pattern in special-pages
    const totalCookiePopUpsBlocked =
        typeof totalCookiePopUpsBlockedValue === 'number' && Number.isFinite(totalCookiePopUpsBlockedValue)
            ? Math.max(0, Math.floor(totalCookiePopUpsBlockedValue))
            : 0;

    // Animate both tracker count and cookie pop-ups count when counterContainer is in viewport
    const animatedTrackersBlocked = useAnimatedCount(totalTrackersBlocked, counterContainerRef);
    const animatedCookiePopUpsBlocked = useAnimatedCount(totalCookiePopUpsBlocked, counterContainerRef);

    // Subscribe to scroll message
    useEffect(() => {
        return ntp.messaging.subscribe('protections_scroll', () => {
            headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [ntp]);

    // Native does not tell the FE if cookie pop up protection is enabled but
    // we can derive this from the value of `totalCookiePopUpsBlocked` in the
    // `ProtectionsService`
    // undefined = browser doesn't support feature, null = feature available but disabled
    const isCpmEnabled = totalCookiePopUpsBlockedValue !== undefined && totalCookiePopUpsBlockedValue !== null;

    const trackersBlockedHeading = animatedTrackersBlocked === 1 ? t('stats_countBlockedSingular') : t('stats_countBlockedPlural');

    const cookiePopUpsBlockedHeading =
        animatedCookiePopUpsBlocked === 1 ? t('stats_totalCookiePopUpsBlockedSingular') : t('stats_totalCookiePopUpsBlockedPlural');

    return (
        <div class={styles.heading} data-testid="ProtectionsHeading" ref={headingRef}>
            <div class={cn(styles.control, animatedTrackersBlocked === 0 && styles.noTrackers)}>
                <span class={styles.headingIcon}>
                    <img src={'./icons/Shield-Check-Color-16.svg'} alt="Privacy Shield" />
                </span>
                <h2 class={styles.caption}>{t('protections_menuTitle')}</h2>

                <Tooltip content={t('stats_protectionsReportInfo')}>
                    <InfoIcon class={styles.infoIcon} />
                </Tooltip>

                {canExpand && (
                    <span class={styles.widgetExpander}>
                        <ShowHideButtonCircle
                            buttonAttrs={{
                                ...buttonAttrs,
                                'aria-expanded': expansion === 'expanded',
                                'aria-pressed': expansion === 'expanded',
                            }}
                            onClick={onToggle}
                            label={expansion === 'expanded' ? t('stats_hideLabel') : t('stats_toggleLabel')}
                        />
                    </span>
                )}
            </div>
            <div class={styles.counterContainer} ref={counterContainerRef}>
                {/* Total Trackers Blocked  */}
                <div class={styles.counter}>
                    {animatedTrackersBlocked === 0 && <h3 class={styles.noRecentTitle}>{t('protections_noRecent')}</h3>}
                    {animatedTrackersBlocked > 0 && (
                        <h3 class={styles.title}>
                            {formatter.format(animatedTrackersBlocked)} <span>{trackersBlockedHeading}</span>
                        </h3>
                    )}
                </div>

                {/* Total Cookie Pop-Ups Blocked */}
                {/* Rules: Display CPM stats when Cookie Pop-Up Protection is
                enabled AND both `animatedTrackersBlocked` and
                `totalCookiePopUpsBlocked` are at least 1 */}
                {isCpmEnabled && animatedTrackersBlocked > 0 && totalCookiePopUpsBlocked > 0 && (
                    <div class={cn(styles.counter, styles.cookiePopUpsCounter)}>
                        <h3 class={styles.title}>
                            {formatter.format(animatedCookiePopUpsBlocked)} <span>{cookiePopUpsBlockedHeading}</span>
                        </h3>
                        {showProtectionsReportNewLabel && <NewBadge />}
                    </div>
                )}
            </div>
        </div>
    );
}
