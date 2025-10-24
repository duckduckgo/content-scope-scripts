import { useTypedTranslationWith } from '../../types.js';
import styles from '../../privacy-stats/components/PrivacyStats.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';
import { InfoIcon, NewBadgeIcon } from '../../components/Icons.js';

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
 * @param {import("@preact/signals").Signal<number>} props.totalCookiePopUpsBlockedSignal
 */
export function ProtectionsHeading({ expansion, canExpand, blockedCountSignal, onToggle, buttonAttrs = {}, totalCookiePopUpsBlockedSignal }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const totalTrackersBlocked = blockedCountSignal.value;
    const totalCookiePopUpsBlocked = totalCookiePopUpsBlockedSignal.value;

    // @todo jingram get these values from native
    const isCpmEnabled = true; // Is Cookie pop-up protection in app
    const shouldShowCookiePopUpsBlocked = true; // from ProtectionsConfig

    const trackersBlockedHeading = totalTrackersBlocked === 1
        ? t('stats_countBlockedSingular')
        : t('stats_countBlockedPlural')

    const cookiePopUpsBlockedHeading = totalCookiePopUpsBlocked === 1
        ? t('stats_totalCookiePopUpsBlockedSingular')
        : t('stats_totalCookiePopUpsBlockedPlural')

    return (
        <div class={styles.heading} data-testid="ProtectionsHeading">
            <div class={cn(styles.control, totalTrackersBlocked === 0 && styles.noTrackers)}>
                <span class={styles.headingIcon}>
                    <img src={'./icons/Shield-Check-Color-16.svg'} alt="Privacy Shield" />
                </span>
                <h2 class={styles.caption}>{t('protections_menuTitle')}</h2>
                <InfoIcon class={styles.infoIcon}/>
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
                  {totalTrackersBlocked === 0 && (
                    <h3 class={styles.title}>{t('protections_noRecent')}</h3>
                  )}
                  {totalTrackersBlocked > 0 && (
                    <h3 class={styles.title}>
                      <span>{totalTrackersBlocked}</span>
                      {trackersBlockedHeading}
                    </h3>
                  )}
                </div>

                {/* Total Cookie Pop-Ups Blocked */}
                {/* Rules: Display CPM stats when Cookie Pop-Up Protection is
                enabled AND both `totalTrackersBlocked` and
                `totalCookiePopUpsBlocked` are at least 1 */}
                {(shouldShowCookiePopUpsBlocked && isCpmEnabled && totalTrackersBlocked > 0 && totalCookiePopUpsBlocked > 0) && (
                  <div class={styles.counter}>
                      <h3 class={styles.title}>
                        <span>{totalCookiePopUpsBlocked}</span>
                        {cookiePopUpsBlockedHeading}
                      </h3>
                      <NewBadgeIcon />
                  </div>
                )}
            </div>
        </div>
    );
}
