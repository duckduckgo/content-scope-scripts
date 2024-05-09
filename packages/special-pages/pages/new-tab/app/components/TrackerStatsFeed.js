import {Component, h} from "preact"
// import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from "../hooks/use-translation";
import styles from './TrackerStatsFeed.module.css';
import {companyNameToSVG} from "./CompanyIcon";

/**
 * This component is used to display an icon representing a company, based on the provided name.
 *
 * @param {Object} props - The props object containing the following properties:
 * @param {string} props.name - The name of the company for which the icon needs to be displayed.
 */
function CompanyIcon(props) {
    const icon = companyNameToSVG(props.name);
    if (!icon) {
        throw new Error('unreachable?')
    }
    const publicPath = '/js' + icon.slice(1);
    return <img src={publicPath} />;
}

const numberFormatter = new Intl.NumberFormat();

/**
 * Renders the tracker stats feed based on the provided props.
 *
 * @param {Object} props - The properties object containing the necessary data.
 * @param {Object} props.data - The data object containing the required information for rendering the feed.
 * @param {Array} props.data.trackerCompanies - An array of tracker company objects.
 * @param {string} props.data.trackerCompaniesPeriod - The period for which the tracker companies are displayed.
 * @param {number} props.data.totalCount - The total count of tracker companies.
 */
function TrackerStatsFeed(props) {
    if (props.data.trackerCompanies.length === 0) {
        let variant = props.data.totalCount === 0 ? 'no-activity' : 'no-recent-activity';
        if (props.data.trackerCompaniesPeriod === 'last-hour') {
            variant = 'no-recent-activity-hour';
        }

        return <EmptyHeading variant={variant} />;
    }

    return <FeedList items={props.data.trackerCompanies} trackerCompaniesPeriod={props.data.trackerCompaniesPeriod} />;
}

// TrackerStatsFeed.propTypes = {
//     /**
//      * 'data' here will roughly match what we receive from the extension
//      */
//     data: PropTypes.shape({
//         trackerCompaniesPeriod: PropTypes.oneOf(['last-day', 'last-hour']),
//         trackerCompanies: PropTypes.arrayOf(
//             PropTypes.shape({
//                 displayName: PropTypes.string.isRequired,
//                 count: PropTypes.number.isRequired,
//             })
//         ).isRequired,
//         totalCount: PropTypes.number.isRequired,
//     }).isRequired,
// };

function FeedList(props) {
    const max = props.items[0]?.count ?? 0;
    const desc = useFeedDescription(props);

    return (
        <div>
            <h2 className={classnames(styles.heading, styles.withFeed)}>{desc}</h2>
            <ul className={styles.list}>
                {props.items.map((item, index) => {
                    return <FeedListItem key={item.displayName} item={item} max={max} index={index} />;
                })}
            </ul>
        </div>
    );
}

/**
 * @param {{items: {count: number}[], trackerCompaniesPeriod: 'last-day' | 'last-hour'}} props
 */
function useFeedDescription(props) {
    const totalCount = props.items.reduce((acc, company) => acc + company.count, 0);
    const { translate } = useTranslation();
    if (props.trackerCompaniesPeriod === 'last-day') {
        if (totalCount === 1) {
            return translate('TRACKER_STATS_FEED_COUNT_BLOCKED_SINGULAR');
        }
        const countText = numberFormatter.format(totalCount);
        return translate('TRACKER_STATS_FEED_COUNT_BLOCKED_PLURAL', countText);
    }
    return translate('TRACKER_STATS_RECENT_HEADING_HOUR');
}

function FeedListItem(props) {
    const { item, max, isHidden } = props;
    const percentage = Math.min((item.count * 100) / max, 100);
    const valueOrMin = Math.max(percentage, 10);
    const inlineStyles = {
        minWidth: `${valueOrMin}%`,
    };
    const countText = numberFormatter.format(item.count);

    return (
        <li className={classnames(styles.item, { [styles.hiddenFeedListItem]: isHidden })} data-testid="FeedListItem">
            <div className={styles.name}>
                <span className={styles.companyIcon}>
                    <CompanyIcon name={item.displayName} />
                </span>
                <span className={styles.companyName}>{item.displayName}</span>
            </div>
            <div className={styles.count}>{countText}</div>
            <div className={styles.bar}>
                <div className={styles.barInner} style={inlineStyles}></div>
            </div>
        </li>
    );
}

function EmptyHeading(props) {
    const { translate } = useTranslation();
    const headingText = {
        'no-activity': translate('TRACKER_STATS_NO_ACTIVITY'),
        'no-recent-activity': translate('TRACKER_STATS_NO_RECENT_ACTIVITY'),
        'no-recent-activity-hour': translate('TRACKER_STATS_NO_RECENT_ACTIVITY_HOUR'),
    };

    return (
        <div>
            <p className={styles.heading}>{headingText[props.variant]}</p>
        </div>
    );
}

// EmptyHeading.propTypes = {
//     variant: PropTypes.oneOf(['no-activity', 'no-recent-activity', 'no-recent-activity-hour']).isRequired,
// };

export { TrackerStatsFeed };
