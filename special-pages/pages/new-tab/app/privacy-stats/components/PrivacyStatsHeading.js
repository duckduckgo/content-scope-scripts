import { useTypedTranslationWith } from '../../types.js';
import { useState } from 'preact/hooks';
import styles from './PrivacyStats.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';
import { useAdBlocking } from '../../settings.provider.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {enStrings} Strings
 * @param {object} props
 * @param {import('../../../types/new-tab.js').Expansion} props.expansion
 * @param {number} props.recent
 * @param {boolean} props.canExpand
 * @param {() => void} props.onToggle
 * @param {import('preact').ComponentProps<'button'>} [props.buttonAttrs]
 */
export function PrivacyStatsHeading({ expansion, canExpand, recent, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [formatter] = useState(() => new Intl.NumberFormat());
    const adBlocking = useAdBlocking();

    const none = recent === 0;
    const some = recent > 0;
    const alltime = formatter.format(recent);

    let alltimeTitle;
    if (recent === 1) {
        alltimeTitle = adBlocking ? t('stats_countBlockedAdsAndTrackersSingular') : t('stats_countBlockedSingular');
    } else {
        alltimeTitle = adBlocking
            ? t('stats_countBlockedAdsAndTrackersPlural', { count: alltime })
            : t('stats_countBlockedPlural', { count: alltime });
    }

    return (
        <div className={cn(styles.heading, { [styles.adsAndTrackersVariant]: adBlocking })} data-testid="PrivacyStatsHeading">
            <span className={styles.headingIcon}>
                <img src={adBlocking ? './icons/shield-green.svg' : './icons/shield.svg'} alt="Privacy Shield" />
            </span>
            {none && <h2 className={styles.title}>{adBlocking ? t('stats_noRecentAdsAndTrackers') : t('stats_noRecent')}</h2>}
            {some && (
                <h2 className={styles.title}>
                    {' '}
                    <Trans str={alltimeTitle} values={{ count: alltime }} />
                </h2>
            )}
            {canExpand && (
                <span className={styles.widgetExpander}>
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
            {recent === 0 && (
                <p className={cn(styles.subtitle, { [styles.indented]: !adBlocking })}>
                    {adBlocking ? t('stats_noActivityAdsAndTrackers') : t('stats_noActivity')}
                </p>
            )}
            {recent > 0 && (
                <p className={cn(styles.subtitle, styles.indented, { [styles.uppercase]: !adBlocking })}>
                    {t('stats_feedCountBlockedPeriod')}
                </p>
            )}
        </div>
    );
}
