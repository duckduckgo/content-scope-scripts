import { useTypedTranslationWith } from '../../types.js';
import styles from '../../privacy-stats/components/PrivacyStats.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';
import { InfoIcon, NewBadgeIcon } from '../../components/Icons.js';
import { Tooltip } from '../../components/Tooltip/Tooltip.js';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { animateCount } from '../utils/animateCount.js';

/**
 * @import enStrings from "../strings.json"
 * @import statsStrings from "../../privacy-stats/strings.json"
 * @import activityStrings from "../../activity/strings.json"
 * @typedef {enStrings & statsStrings & activityStrings} Strings
 * @typedef {import('../utils/animateCount.js').AnimationUpdateCallback} AnimationUpdateCallback
 * @param {object} props
 * @param {import('../../../types/new-tab.ts').Expansion} props.expansion
 * @param {import("@preact/signals").Signal<number>} props.blockedCountSignal
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import('preact').ComponentProps<'button'>} [props.buttonAttrs]
 * @param {import("@preact/signals").Signal<undefined | number | null>} props.totalCookiePopUpsBlockedSignal
 */
export function ProtectionsHeading({
    expansion,
    canExpand,
    blockedCountSignal,
    onToggle,
    buttonAttrs = {},
    totalCookiePopUpsBlockedSignal,
}) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const totalTrackersBlocked = blockedCountSignal.value;
    const totalCookiePopUpsBlockedValue = totalCookiePopUpsBlockedSignal.value;

    // Defensive validation following pattern in special-pages
    const totalCookiePopUpsBlocked =
        typeof totalCookiePopUpsBlockedValue === 'number' && Number.isFinite(totalCookiePopUpsBlockedValue)
            ? Math.max(0, Math.floor(totalCookiePopUpsBlockedValue))
            : 0;

    // State for animated cookie pop-ups count
    // Initialize to 0 so first render triggers percentage-based animation from spec
    const [animatedCookiePopUpsBlocked, setAnimatedCookiePopUpsBlocked] = useState(0);

    // Track current animated value to enable smooth incremental updates
    // Initialize to 0 so first animation uses spec's percentage-based starting point
    const animatedValueRef = useRef(/** @type {number} */ (0));

    // Memoize the update callback to avoid recreating it on every render
    const updateAnimatedCount = useCallback(
        /** @type {AnimationUpdateCallback} */ ((value) => {
            animatedValueRef.current = value;
            setAnimatedCookiePopUpsBlocked(value);
        }),
        []
    );

    // Animate cookie pop-ups count when it changes and page is visible
    useEffect(() => {
        let cancelAnimation = () => {};

        // Start animation if page is currently visible
        if (document.visibilityState === 'visible') {
            cancelAnimation = animateCount(
                totalCookiePopUpsBlocked,
                updateAnimatedCount,
                undefined,
                animatedValueRef.current
            );
        } else {
            // Page is hidden - set value immediately without animation
            setAnimatedCookiePopUpsBlocked(totalCookiePopUpsBlocked);
            animatedValueRef.current = totalCookiePopUpsBlocked;
        }

        // Listen for visibility changes to start/stop animation
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Page became visible - start animation from current displayed value
                cancelAnimation();
                cancelAnimation = animateCount(
                    totalCookiePopUpsBlocked,
                    updateAnimatedCount,
                    undefined,
                    animatedValueRef.current
                );
            } else {
                // Page became hidden - cancel animation and snap to final value
                cancelAnimation();
                setAnimatedCookiePopUpsBlocked(totalCookiePopUpsBlocked);
                animatedValueRef.current = totalCookiePopUpsBlocked;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup animation and event listener
        return () => {
            cancelAnimation();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [totalCookiePopUpsBlocked, updateAnimatedCount]);

    // Native does not tell the FE if cookie pop up protection is enabled but
    // we can derive this from the value of `totalCookiePopUpsBlocked` in the
    // `ProtectionsService`
    // undefined = browser doesn't support feature, null = feature available but disabled
    const isCpmEnabled = totalCookiePopUpsBlockedSignal.value !== undefined && totalCookiePopUpsBlockedSignal.value !== null;

    const trackersBlockedHeading = totalTrackersBlocked === 1 ? t('stats_countBlockedSingular') : t('stats_countBlockedPlural');

    const cookiePopUpsBlockedHeading =
        animatedCookiePopUpsBlocked === 1 ? t('stats_totalCookiePopUpsBlockedSingular') : t('stats_totalCookiePopUpsBlockedPlural');

    return (
        <div class={styles.heading} data-testid="ProtectionsHeading">
            <div class={cn(styles.control, totalTrackersBlocked === 0 && styles.noTrackers)}>
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
            <div class={styles.counterContainer}>
                {/* Total Trackers Blocked  */}
                <div class={styles.counter}>
                    {totalTrackersBlocked === 0 && <h3 class={styles.title}>{t('protections_noRecent')}</h3>}
                    {totalTrackersBlocked > 0 && (
                        <h3 class={styles.title}>
                            <span>{totalTrackersBlocked}</span> {trackersBlockedHeading}
                        </h3>
                    )}
                </div>

                {/* Total Cookie Pop-Ups Blocked */}
                {/* Rules: Display CPM stats when Cookie Pop-Up Protection is
                enabled AND both `totalTrackersBlocked` and
                `totalCookiePopUpsBlocked` are at least 1 */}
                {isCpmEnabled && totalTrackersBlocked > 0 && totalCookiePopUpsBlocked > 0 && (
                    <div class={styles.counter}>
                        <h3 class={styles.title}>
                            <span>{animatedCookiePopUpsBlocked}</span> {cookiePopUpsBlockedHeading}
                        </h3>
                        {/* @todo `NewBadgeIcon` will be manually removed in
                        a future iteration */}
                        <NewBadgeIcon />
                    </div>
                )}
            </div>
        </div>
    );
}
