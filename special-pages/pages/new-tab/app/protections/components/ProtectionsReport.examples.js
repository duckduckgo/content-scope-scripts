import { h } from 'preact';
import { useState } from 'preact/hooks';
import { ProtectionsReport } from './ProtectionsReport.js';
import { privacyStatsMocks } from '../../privacy-stats/mocks/privacy-stats.mocks.js';
import { protectionsMocks } from '../mocks/protections.mocks.js';

/**
 * @import { PrivacyStatsData, FeedType, Expansion } from '../../../types/new-tab.js'
 */

/**
 * Holds expansion + feed locally so the examples are interactive.
 *
 * @param {object} props
 * @param {PrivacyStatsData} props.stats
 * @param {number} props.blockedCount
 * @param {number | null} props.cookiePopUpsBlocked
 * @param {FeedType} [props.feed]
 * @param {Expansion} [props.expansion]
 */
function ReportExample({
    stats,
    blockedCount,
    cookiePopUpsBlocked,
    feed: initialFeed = 'purposes',
    expansion: initialExpansion = 'expanded',
}) {
    const [feed, setFeed] = useState(initialFeed);
    const [expansion, setExpansion] = useState(initialExpansion);
    return (
        <ProtectionsReport
            expansion={expansion}
            toggle={() => setExpansion((x) => (x === 'expanded' ? 'collapsed' : 'expanded'))}
            feed={feed}
            setFeed={setFeed}
            blockedCount={blockedCount}
            cookiePopUpsBlocked={cookiePopUpsBlocked}
            stats={stats}
            sites={<p>The by-site view is the activity feed. Open the full page with `protections_feed=activity` to see it.</p>}
        />
    );
}

const report = {
    stats: privacyStatsMocks.report,
    blockedCount: protectionsMocks.report.totalCount,
    cookiePopUpsBlocked: protectionsMocks.report.totalCookiePopUpsBlocked ?? null,
};

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const protectionsReportExamples = {
    'protectionsReport.purposes': {
        factory: () => <ReportExample {...report} />,
    },
    'protectionsReport.companies': {
        factory: () => <ReportExample {...report} feed="companies" />,
    },
    'protectionsReport.recognition': {
        factory: () => <ReportExample {...report} feed="recognition" />,
    },
    'protectionsReport.topSites': {
        factory: () => <ReportExample {...report} feed="top-sites" />,
    },
    'protectionsReport.collapsed': {
        factory: () => <ReportExample {...report} expansion="collapsed" />,
    },
    'protectionsReport.withoutCategories': {
        factory: () => <ReportExample {...report} stats={privacyStatsMocks.reportWithoutCategories} />,
    },
    'protectionsReport.cookiePopUpsDisabled': {
        factory: () => <ReportExample {...report} cookiePopUpsBlocked={null} />,
    },
    'protectionsReport.empty': {
        factory: () => <ReportExample stats={privacyStatsMocks.none} blockedCount={0} cookiePopUpsBlocked={0} />,
    },
};
