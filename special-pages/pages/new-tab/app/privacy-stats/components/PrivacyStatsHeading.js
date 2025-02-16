import { useTypedTranslationWith } from '../../types.js';
import { useState } from 'preact/hooks';
import styles from './PrivacyStats.module.css';
import { ShowHideButtonCircle } from '../../components/ShowHideButton.jsx';
import cn from 'classnames';
import { h } from 'preact';

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

    const none = recent === 0;
    const some = recent > 0;
    const alltime = formatter.format(recent);
    const alltimeTitle = recent === 1 ? t('stats_countBlockedSingular') : t('stats_countBlockedPlural', { count: alltime });

    return (
        <div className={styles.heading}>
            <span className={styles.headingIcon}>
                <img src="./icons/shield.svg" alt="Privacy Shield" />
            </span>
            {none && <h2 className={styles.title}>{t('stats_noRecent')}</h2>}
            {some && <h2 className={styles.title}>{alltimeTitle}</h2>}
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
            {recent === 0 && <p className={styles.subtitle}>{t('stats_noActivity')}</p>}
            {recent > 0 && <p className={cn(styles.subtitle, styles.uppercase)}>{t('stats_feedCountBlockedPeriod')}</p>}
        </div>
    );
}
