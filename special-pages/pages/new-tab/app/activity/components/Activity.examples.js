import { h } from 'preact';
import { Activity, ActivityBody } from './Activity.js';
import { noop } from '../../utils.js';
import { signal } from '@preact/signals';
import { generateSampleData } from '../mocks/activity.mock-transport.js';
import { normalizeData, NormalizedDataContext } from '../NormalizeDataProvider.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const activityExamples = {
    'activity.empty': {
        factory: () => {
            return (
                <Activity
                    expansion={'expanded'}
                    itemCount={0}
                    trackerCount={0}
                    toggle={noop('toggle')}
                    didClick={noop('did click')}
                    batched={false}
                />
            );
        },
    },
    'activity.few': {
        factory: () => (
            <Activity
                expansion={'expanded'}
                itemCount={10}
                trackerCount={20}
                toggle={noop('toggle')}
                didClick={noop('did click')}
                batched={false}
            >
                <Mock size={3}>
                    <ActivityBody canBurn={false} visibility={'visible'} />
                </Mock>
            </Activity>
        ),
    },
    'activity.noTrackers': {
        factory: () => (
            <Activity
                expansion={'expanded'}
                itemCount={20}
                trackerCount={0}
                toggle={noop('toggle')}
                didClick={noop('did click')}
                batched={false}
            >
                <Mock size={1}>
                    <ActivityBody canBurn={false} visibility={'visible'} />
                </Mock>
            </Activity>
        ),
    },
};

/**
 * Creates a context provider for normalized data that includes sample activity data, URLs, and tracking status.
 *
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children The child nodes to render within the context provider.
 * @param {number} props.size The number of sample data entries to generate for the mock data.
 */
function Mock({ children, size }) {
    const mocks = generateSampleData(size);
    const items = normalizeData(
        {
            items: {},
            history: {},
            trackingStatus: {},
            favorites: {},
            urls: [],
            totalTrackers: 0,
        },
        { activity: mocks, urls: mocks.map((x) => x.url), totalTrackers: 0 },
    );
    return (
        <NormalizedDataContext.Provider
            value={{
                activity: signal(items),
                keys: signal(items.urls),
            }}
        >
            {children}
        </NormalizedDataContext.Provider>
    );
}
