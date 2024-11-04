import { h } from 'preact'
import cn from 'classnames'
import styles from './PrivacyStats.module.css'
import { useTypedTranslation } from '../types.js'
import { useContext, useState, useId, useCallback } from 'preact/hooks'
import { PrivacyStatsContext, PrivacyStatsProvider } from './PrivacyStatsProvider.js'
import { useVisibility } from '../widget-list/widget-config.provider.js'
import { viewTransition } from '../utils.js'
import { ShowHideButton } from '../components/ShowHideButton.jsx'
import { useCustomizer } from '../customizer/Customizer.js'

/**
 * @typedef {import('../../../../types/new-tab').TrackerCompany} TrackerCompany
 * @typedef {import('../../../../types/new-tab').Expansion} Expansion
 * @typedef {import('../../../../types/new-tab').Animation} Animation
 * @typedef {import('../../../../types/new-tab').PrivacyStatsData} PrivacyStatsData
 * @typedef {import('../../../../types/new-tab').StatsConfig} StatsConfig
 * @typedef {import("./PrivacyStatsProvider.js").Events} Events
 */

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyStatsData} props.data
 * @param {()=>void} props.toggle
 * @param {Animation['kind']} [props.animation] - optionally configure animations
 */
export function PrivacyStats ({ expansion, data, toggle, animation = 'auto-animate' }) {
    if (animation === 'view-transitions') {
        return <WithViewTransitions data={data} expansion={expansion} toggle={toggle} />
    }

    // no animations
    return <PrivacyStatsConfigured expansion={expansion} data={data} toggle={toggle} />
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {PrivacyStatsData} props.data
 * @param {()=>void} props.toggle
 */
function WithViewTransitions ({ expansion, data, toggle }) {
    const willToggle = useCallback(() => {
        viewTransition(toggle)
    }, [toggle])
    return <PrivacyStatsConfigured expansion={expansion} data={data} toggle={willToggle} />
}

/**
 * @param {object} props
 * @param {import("preact").Ref<any>} [props.parentRef]
 * @param {Expansion} props.expansion
 * @param {PrivacyStatsData} props.data
 * @param {()=>void} props.toggle
 */
function PrivacyStatsConfigured ({ parentRef, expansion, data, toggle }) {
    const expanded = expansion === 'expanded'
    const someCompanies = data.trackerCompanies.length > 0

    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId()
    const TOGGLE_ID = useId()

    return (
        <div class={cn('layout-centered', styles.root)} ref={parentRef}>
            <Heading
                totalCount={data.totalCount}
                trackerCompanies={data.trackerCompanies}
                onToggle={toggle}
                expansion={expansion}
                buttonAttrs={{
                    'aria-controls': WIDGET_ID,
                    id: TOGGLE_ID
                }}
            />
            {expanded && someCompanies && (
                <Body trackerCompanies={data.trackerCompanies} listAttrs={{ id: WIDGET_ID }} />
            )}
        </div>
    )
}

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {TrackerCompany[]} props.trackerCompanies
 * @param {number} props.totalCount
 * @param {() => void} props.onToggle
 * @param {import("preact").ComponentProps<'button'>} [props.buttonAttrs]
 */
export function Heading ({ expansion, trackerCompanies, totalCount, onToggle, buttonAttrs = {} }) {
    const { t } = useTypedTranslation()
    const [formatter] = useState(() => new Intl.NumberFormat())
    const recent = trackerCompanies.reduce((sum, item) => sum + item.count, 0)
    const recentTitle = recent === 1
        ? t('trackerStatsFeedCountBlockedSingular')
        : t('trackerStatsFeedCountBlockedPlural', { count: formatter.format(recent) })

    const none = totalCount === 0
    const some = totalCount > 0
    const alltime = formatter.format(totalCount)
    const alltimeTitle = totalCount === 1
        ? t('trackerStatsCountBlockedSingular')
        : t('trackerStatsCountBlockedPlural', { count: alltime })

    return (
        <div className={styles.heading}>
            <span className={styles.headingIcon}>
                <img src="./icons/shield.svg" alt=""/>
            </span>
            {none && (
                <p className={styles.title}>{t('trackerStatsNoRecent')}</p>
            )}
            {some && (
                <p className={styles.title}>{alltimeTitle}</p>
            )}
            <span className={styles.expander}>
                <ShowHideButton
                    buttonAttrs={{
                        ...buttonAttrs,
                        hidden: trackerCompanies.length === 0,
                        'aria-expanded': expansion === 'expanded',
                        'aria-pressed': expansion === 'expanded'
                    }}
                    onClick={onToggle}
                    text={expansion === 'expanded'
                        ? t('trackerStatsHideLabel')
                        : t('trackerStatsToggleLabel')}
                />
            </span>
            <p className={styles.subtitle}>
                {recent === 0 && t('trackerStatsNoActivity')}
                {recent > 0 && recentTitle}
            </p>
        </div>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentProps<'ul'>} [props.listAttrs]
 * @param {TrackerCompany[]} props.trackerCompanies
 */
// eslint-disable-next-line no-redeclare
export function Body ({ trackerCompanies, listAttrs = {} }) {
    const max = trackerCompanies[0]?.count ?? 0
    const [formatter] = useState(() => new Intl.NumberFormat())

    return (
        <ul {...listAttrs} class={styles.list}>
            {trackerCompanies.map(company => {
                const percentage = Math.min((company.count * 100) / max, 100)
                const valueOrMin = Math.max(percentage, 10)
                const inlineStyles = {
                    width: `${valueOrMin}%`
                }
                const countText = formatter.format(company.count)
                return (
                    <li key={company.displayName}>
                        <div class={styles.row}>
                            <div class={styles.company}>
                                <CompanyIcon company={company}/>
                                <span class={styles.name}>{company.displayName}</span>
                            </div>
                            <span class={styles.count}>{countText}</span>
                            <span class={styles.bar}></span>
                            <span class={styles.fill} style={inlineStyles}></span>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function PrivacyStatsCustomized () {
    const { t } = useTypedTranslation()
    const { visibility, id, toggle, index } = useVisibility()

    const title = t('trackerStatsMenuTitle')
    useCustomizer({ title, id, icon: 'shield', toggle, visibility, index })

    if (visibility === 'hidden') {
        return null
    }

    return (
        <PrivacyStatsProvider>
            <PrivacyStatsConsumer />
        </PrivacyStatsProvider>
    )
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
export function PrivacyStatsConsumer () {
    const { state, toggle } = useContext(PrivacyStatsContext)
    if (state.status === 'ready') {
        return (
            <PrivacyStats
                expansion={state.config.expansion}
                animation={state.config.animation?.kind}
                data={state.data}
                toggle={toggle}
            />
        )
    }
    return null
}

function CompanyIcon ({ company }) {
    const icon = company.displayName.toLowerCase().split('.')[0]
    const cleaned = icon.replace(/ /g, '-')
    const firstChar = icon[0]

    return (
        <span className={styles.icon}>
            {icon === 'other' && <Other/>}
            {icon !== 'other' && (
                <img src={`./company-icons/${cleaned}.svg`}
                    alt={icon + ' icon'}
                    className={styles.companyImgIcon}
                    onLoad={(e) => {
                        if (!e.target) return
                        if (!(e.target instanceof HTMLImageElement)) return
                        e.target.dataset.loaded = String(true)
                    }}
                    onError={(e) => {
                        if (!e.target) return
                        if (!(e.target instanceof HTMLImageElement)) return
                        if (e.target.dataset.loadingFallback) {
                            e.target.dataset.errored = String(true)
                            return
                        }
                        e.target.dataset.loadingFallback = String(true)
                        e.target.src = `./company-icons/${firstChar}.svg`
                    }}/>
            )}
        </span>
    )
}

function Other () {
    return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class={styles.other}>
        <path fill-rule="evenodd" clip-rule="evenodd"
            d="M1 16C1 7.71573 7.71573 1 16 1C24.2843 1 31 7.71573 31 16C31 16.0648 30.9996 16.1295 30.9988 16.1941C30.9996 16.2126 31 16.2313 31 16.25C31 16.284 30.9986 16.3177 30.996 16.3511C30.8094 24.4732 24.1669 31 16 31C7.83308 31 1.19057 24.4732 1.00403 16.3511C1.00136 16.3177 1 16.284 1 16.25C1 16.2313 1.00041 16.2126 1.00123 16.1941C1.00041 16.1295 1 16.0648 1 16ZM3.58907 17.5C4.12835 22.0093 7.06824 25.781 11.0941 27.5006C10.8572 27.0971 10.6399 26.674 10.4426 26.24C9.37903 23.9001 8.69388 20.8489 8.53532 17.5H3.58907ZM8.51564 15H3.53942C3.91376 10.2707 6.92031 6.28219 11.0941 4.49944C10.8572 4.90292 10.6399 5.326 10.4426 5.76003C9.32633 8.21588 8.62691 11.4552 8.51564 15ZM11.0383 17.5C11.1951 20.5456 11.8216 23.2322 12.7185 25.2055C13.8114 27.6098 15.0657 28.5 16 28.5C16.9343 28.5 18.1886 27.6098 19.2815 25.2055C20.1784 23.2322 20.8049 20.5456 20.9617 17.5H11.0383ZM20.983 15H11.017C11.1277 11.7487 11.7728 8.87511 12.7185 6.79454C13.8114 4.39021 15.0657 3.5 16 3.5C16.9343 3.5 18.1886 4.39021 19.2815 6.79454C20.2272 8.87511 20.8723 11.7487 20.983 15ZM23.4647 17.5C23.3061 20.8489 22.621 23.9001 21.5574 26.24C21.3601 26.674 21.1428 27.0971 20.9059 27.5006C24.9318 25.781 27.8717 22.0093 28.4109 17.5H23.4647ZM28.4606 15H23.4844C23.3731 11.4552 22.6737 8.21588 21.5574 5.76003C21.3601 5.326 21.1428 4.90291 20.9059 4.49944C25.0797 6.28219 28.0862 10.2707 28.4606 15Z"
            fill="currentColor" />
    </svg>
}
