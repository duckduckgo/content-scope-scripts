import { h } from 'preact'
import styles from './TrackerStats.module.css'
import { TrackerStatsFeed } from './TrackerStatsFeed'
import { useContext, useState } from 'preact/hooks'
import { useStorageValue, VisibilityContext } from '../providers/visibility.provider.js'
import { useTranslation } from '../hooks/use-translation'
import { Expander, ExpanderHeader, ExpanderHeaderText } from './Expander'
import { Shield } from './Icons'
import { TrackerStatsContext } from '../providers/tracker-stats.provider'
import { useCustomizer } from '../hooks/useCustomizer'

export function TrackerStats () {
    const { visibility, toggle } = useContext(VisibilityContext)
    const { translate } = useTranslation()

    useCustomizer({
        visibility,
        toggle: () => {
            toggle()
        },
        data: {
            id: 'tracker-stats',
            title: translate('TRACKER_STATS_MENU_TITLE'),
            icon: 'shield',
            desc: translate('TRACKER_STATS_INFO_TT_LABEL'),
            order: 2
        }
    })

    return (
        <div className={styles.stats} data-testid="TrackerStats">
            <div hidden={visibility === 'hidden'}>
                <ExpanderOnly featureVisibility={visibility}/>
            </div>
        </div>
    )
}

/**
 * Exported separately for reviewing various states in Storybook
 * @param {object} props
 * @param {import('../../../../types/new-tab').LayoutVisibility} props.featureVisibility
 * @param {string} [props.variant]
 */
export function ExpanderOnly (props) {
    // todo: this will be in the feed for the tracker stats
    const [expansion, toggle] = useState(/** @type {import('../../../../types/new-tab').LayoutExpansionState} */("expanded"))
    const ctx = useContext(TrackerStatsContext)
    function onToggle() {
        toggle(prev => prev === "expanded" ? "collapsed" :"expanded")
    }

    const { translate } = useTranslation()
    const text = <TitleText totalCount={ctx.data.totalCount} />
    const label = translate('TRACKER_STATS_TOGGLE_LABEL')

    let header = (
        <ExpanderHeader expansion={expansion} toggle={onToggle} icon={<Shield />} labelText={label}>
            {text}
        </ExpanderHeader>
    )
    // empty state, no toggle
    if (ctx.data.totalCount === 0) {
        header = <ExpanderHeaderText text={text} icon={<Shield />} />
    }

    return (
        <Expander
            variant={props.variant}
            expansion={expansion}
            featureState={props.featureVisibility}
            restrictedHeight={true}
            header={header}
            body={<TrackerStatsFeed {...ctx} />}
        />
    )
}

const numberFormatter = new Intl.NumberFormat()

/**
 * @param props
 */
export function TitleText (props) {
    const { translate } = useTranslation()
    if (props.totalCount === 0) {
        return translate('TRACKER_STATS_NO_RECENT')
    }
    const numberText = numberFormatter.format(props.totalCount)
    const countText =
        props.totalCount === 1
            ? translate('TRACKER_STATS_COUNT_BLOCKED_SINGULAR')
            : translate('TRACKER_STATS_COUNT_BLOCKED_PLURAL', numberText)
    return countText
}
