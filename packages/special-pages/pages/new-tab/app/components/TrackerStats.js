import { h } from "preact";
import styles from "./TrackerStats.module.css";
import {TrackerStatsFeed} from "./TrackerStatsFeed";
import {useContext} from "preact/hooks";
import {useStorageValue, VisibilityContext} from "../hooks/useFeatureSetting";
import {useTranslation} from "../hooks/use-translation";
import {Expander, ExpanderHeader, ExpanderHeaderText} from "./Expander";
import {Shield} from "./Icons";
import {TrackerStatsContext} from "../providers/tracker-stats.provider";
import {useCustomizer} from "../hooks/useCustomizer";

export function TrackerStats() {
    return (
      <div className={styles.stats} data-testid="TrackerStats">
          <FeatureToggle />
      </div>
    );
}

/**
 * This contains logic/margins outside of this main component (page layout stuff)
 * so it needs to be
 */
function FeatureToggle(props) {
    const { state, toggle } = useContext(VisibilityContext);
    const { translate } = useTranslation();

    useCustomizer({
        state,
        toggle: () => {
            toggle();
        },
        data: {
            id: 'tracker-stats',
            title: translate('TRACKER_STATS_MENU_TITLE'),
            icon: 'shield',
            desc: translate('TRACKER_STATS_INFO_TT_LABEL'),
            order: 2,
        },
    });

    return (
        // <NtpFeatureRow state={state} variant={props.variant} data-testid="TrackerStats">
        <div hidden={state === 'hiding'}>
            <ExpanderOnly variant={props.variant} featureState={state} />
        </div>
        // </NtpFeatureRow>
    );
}

/**
 * Exported separately for reviewing various states in Storybook
 */
export function ExpanderOnly(props) {
    const storage = useStorageValue('hide_new_tab_page_stats');
    const ctx = useContext(TrackerStatsContext);

    const { translate } = useTranslation();
    const text = <TitleText totalCount={ctx.data.totalCount} />;
    const label = translate('TRACKER_STATS_TOGGLE_LABEL');
    let header = (
        <ExpanderHeader state={storage.state} toggle={storage.toggle} icon={<Shield />} labelText={label}>
            {text}
        </ExpanderHeader>
    );
    // empty state, no toggle
    if (ctx.data.totalCount === 0) {
        header = <ExpanderHeaderText text={text} icon={<Shield />} />;
    }

    return (
        <Expander
            variant={props.variant}
            state={storage.state}
            featureState={props.featureState}
            restrictedHeight={true}
            header={header}
            body={<TrackerStatsFeed {...ctx} />}
        />
    );
}

const numberFormatter = new Intl.NumberFormat();

/**
 * @param props
 */
export function TitleText(props) {
    const { translate } = useTranslation();
    if (props.totalCount === 0) {
        return translate('TRACKER_STATS_NO_RECENT');
    }
    let numberText = numberFormatter.format(props.totalCount);
    let countText =
        props.totalCount === 1
            ? translate('TRACKER_STATS_COUNT_BLOCKED_SINGULAR')
            : translate('TRACKER_STATS_COUNT_BLOCKED_PLURAL', numberText);
    return countText;
}
