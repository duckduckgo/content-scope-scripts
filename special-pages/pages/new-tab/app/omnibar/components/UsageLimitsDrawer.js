import { h, Fragment } from 'preact';
import cn from 'classnames';
import { DismissButton } from '../../components/DismissButton';
import { ChevronSmall, InfoIcon } from '../../components/Icons';
import { Dropdown } from './chat-tools/dropdown/Dropdown';
import { DropdownItem } from './chat-tools/dropdown/DropdownItem';
import { useDropdown } from './chat-tools/useDropdown';
import { getModelIcon } from './chat-tools/model-selector/Icons';
import styles from './UsageLimitsDrawer.module.css';

/**
 * @typedef {'info' | 'ring' | 'alert'} UsageLimitsIcon
 * @typedef {'neutral' | 'warning' | 'critical'} UsageLimitsSeverity
 * @typedef {'none' | 'convert'} UsageLimitsCtaLeadingIcon
 * @typedef {{ id: string, name: string, variant?: string }} UsageLimitsCtaAlternative
 * @typedef {{
 *   label: string,
 *   leadingIcon?: UsageLimitsCtaLeadingIcon,
 *   primaryModelId?: string,
 *   showMenu: boolean,
 *   alternatives?: UsageLimitsCtaAlternative[],
 * }} UsageLimitsCta
 */

/**
 * Fixed 16×16 usage ring (native ProgressRing thickness 1.25).
 * @param {object} props
 * @param {number} props.percent
 * @param {UsageLimitsSeverity} props.severity
 */
function UsageLimitsRing({ percent, severity }) {
    const radius = 6.375;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, percent));
    const dash = (clamped / 100) * circumference;

    return (
        <svg class={cn(styles.glyph, styles.ring, styles[`severity_${severity}`])} viewBox="0 0 16 16" aria-hidden="true">
            <circle class={styles.ringTrack} cx="8" cy="8" r={radius} fill="none" stroke-width="1.25" />
            <circle
                class={styles.ringValue}
                cx="8"
                cy="8"
                r={radius}
                fill="none"
                stroke-width="1.25"
                stroke-dasharray={`${dash} ${circumference}`}
                stroke-linecap="butt"
                transform="rotate(-90 8 8)"
            />
        </svg>
    );
}

function UsageLimitsAlertIcon() {
    return (
        <svg class={cn(styles.glyph, styles.alert)} viewBox="0 0 16 16" aria-hidden="true">
            <path
                class={styles.alertTriangle}
                d="M7.134 1.5a1 1 0 0 1 1.732 0l6.01 10.408A1 1 0 0 1 14.01 13.5H1.99a1 1 0 0 1-.866-1.592L7.134 1.5Z"
            />
            <path
                class={styles.alertMark}
                d="M8 5.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 5.25Zm0 6.5a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75Z"
            />
        </svg>
    );
}

/** Convert / switch-model glyph (Convert-16 from DDG Icons). */
function ConvertIcon() {
    return (
        <svg class={styles.convertIcon} viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
            <path
                fill="currentColor"
                d="M4.19193 1.30806C4.43601 1.55214 4.43601 1.94786 4.19193 2.19194L2.75887 3.625H11.875C14.0841 3.625 15.875 5.41586 15.875 7.625C15.875 7.97018 15.5952 8.25 15.25 8.25C14.9048 8.25 14.625 7.97018 14.625 7.625C14.625 6.10622 13.3938 4.875 11.875 4.875H2.75887L4.19193 6.30806C4.43601 6.55214 4.43601 6.94786 4.19193 7.19194C3.94785 7.43602 3.55213 7.43602 3.30805 7.19194L1.42677 5.31066C0.840981 4.72487 0.840979 3.77513 1.42677 3.18934L3.30805 1.30806C3.55213 1.06398 3.94785 1.06398 4.19193 1.30806Z"
            />
            <path
                fill="currentColor"
                d="M13.2411 11.125L11.8081 9.69194C11.564 9.44786 11.564 9.05214 11.8081 8.80806C12.0521 8.56398 12.4479 8.56398 12.692 8.80806L14.5732 10.6893C15.159 11.2751 15.159 12.2249 14.5732 12.8107L12.692 14.6919C12.4479 14.936 12.0521 14.936 11.8081 14.6919C11.564 14.4479 11.564 14.0521 11.8081 13.8081L13.2411 12.375L4 12.375C1.79086 12.375 0 10.5841 0 8.375C0 8.02982 0.279823 7.75 0.625 7.75C0.970178 7.75 1.25 8.02982 1.25 8.375C1.25 9.89378 2.48122 11.125 4 11.125L13.2411 11.125Z"
            />
        </svg>
    );
}

/**
 * @param {object} props
 * @param {UsageLimitsCta} props.cta
 * @param {(modelId?: string) => void} props.onSelectCta
 */
function UsageLimitsCtaControl({ cta, onSelectCta }) {
    const menu = useDropdown({ align: 'right' });
    const showConvert = cta.leadingIcon === 'convert';
    const alternatives = cta.alternatives ?? [];
    const showMenu = cta.showMenu === true && alternatives.length > 0;

    const handlePrimary = () => {
        onSelectCta(cta.primaryModelId);
        menu.close();
    };

    return (
        <div class={styles.ctaSplit}>
            <button
                type="button"
                class={cn(styles.ctaPrimary, showMenu ? styles.ctaPrimarySplit : styles.ctaPrimarySolo)}
                onClick={handlePrimary}
            >
                {showConvert ? <ConvertIcon /> : null}
                <span class={styles.ctaLabel}>{cta.label}</span>
            </button>
            {showMenu ? (
                <Fragment>
                    <button
                        ref={menu.buttonRef}
                        type="button"
                        class={styles.ctaMenu}
                        aria-label="Show more models"
                        aria-expanded={menu.isOpen}
                        aria-haspopup="menu"
                        onClick={menu.toggle}
                    >
                        <ChevronSmall />
                    </button>
                    {menu.isOpen && menu.dropdownPos ? (
                        <Dropdown
                            role="menu"
                            ariaLabel="Switch model"
                            position={menu.dropdownPos}
                            dropdownRef={menu.dropdownRef}
                            onClose={({ restoreFocus }) => {
                                menu.close();
                                if (restoreFocus) menu.buttonRef.current?.focus();
                            }}
                            idPrefix="usage-limits-cta"
                        >
                            {alternatives.map((alt) => {
                                const Icon = getModelIcon(alt.id);
                                const name = alt.variant ? `${alt.name} ${alt.variant}` : alt.name;
                                return (
                                    <DropdownItem
                                        key={alt.id}
                                        role="menuitem"
                                        name={name}
                                        showCheckGutter={false}
                                        icon={Icon ? <Icon /> : undefined}
                                        onSelect={() => {
                                            onSelectCta(alt.id);
                                            menu.close();
                                        }}
                                    />
                                );
                            })}
                        </Dropdown>
                    ) : null}
                </Fragment>
            ) : null}
        </div>
    );
}

/**
 * @param {object} props
 * @param {string} props.message
 * @param {string} [props.secondaryText]
 * @param {UsageLimitsIcon} [props.icon]
 * @param {number} [props.percent]
 * @param {UsageLimitsSeverity} [props.severity]
 * @param {UsageLimitsCta | null} [props.cta]
 * @param {(modelId?: string) => void} [props.onSelectCta]
 * @param {() => void} [props.onDismiss]
 */
export function UsageLimitsDrawer({
    message,
    secondaryText,
    icon = 'info',
    percent = 0,
    severity = 'neutral',
    cta = null,
    onSelectCta,
    onDismiss,
}) {
    const emphasize = icon === 'ring' || icon === 'alert';

    return (
        <div class={styles.drawer} data-testid="usage-limits-drawer" role="status">
            <div class={styles.card}>
                <div class={styles.content}>
                    <span class={styles.leading}>
                        {icon === 'ring' ? (
                            <UsageLimitsRing percent={percent} severity={severity} />
                        ) : icon === 'alert' ? (
                            <UsageLimitsAlertIcon />
                        ) : (
                            <InfoIcon class={cn(styles.glyph, styles.info)} aria-hidden="true" />
                        )}
                    </span>
                    <p class={cn(styles.message, emphasize && styles.messageEmphasized)}>
                        <span>{message}</span>
                        {secondaryText ? <span class={styles.secondary}>{secondaryText}</span> : null}
                    </p>
                    {cta && onSelectCta ? <UsageLimitsCtaControl cta={cta} onSelectCta={onSelectCta} /> : null}
                    {onDismiss ? <DismissButton className={styles.dismiss} onClick={onDismiss} /> : null}
                </div>
            </div>
        </div>
    );
}
