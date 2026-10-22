import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { SetupChecklist } from '../setup-checklist/SetupChecklist.js';

export function factory() {
    return (
        <Centered data-entry-point="setupChecklist">
            <SetupChecklist />
        </Centered>
    );
}
