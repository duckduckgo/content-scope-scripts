import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { ActivityCustomized } from '../activity/components/Activity.js';

export function factory() {
    return (
        <Centered data-entry-point="activity">
            <ActivityCustomized />
        </Centered>
    );
}
