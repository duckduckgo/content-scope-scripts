import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { NextStepsListCustomized } from '../next-steps-list/NextStepsList.js';

export function factory() {
    return (
        <Centered data-entry-point="nextStepsList">
            <NextStepsListCustomized />
        </Centered>
    );
}
