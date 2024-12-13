import { h } from 'preact';
import { noop } from '../../utils.js';
import { FreemiumPIRBanner } from './FreemiumPIRBanner.js';
import { freemiumPIRDataExamples } from '../mocks/freemiumPIRBanner.data.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const FreemiumPIRBannerExamples = {
    'freemiumPIR.onboarding': {
        factory: () => (
            <FreemiumPIRBanner
                message={freemiumPIRDataExamples.unused.content}
                dismiss={noop('freemiumPIRBanner_dismiss')}
                action={noop('freemiumPIRBanner_action')}
            />
        ),
    },
    'freemiumPIR.scan_results': {
        factory: () => (
            <FreemiumPIRBanner
                message={freemiumPIRDataExamples.used.content}
                dismiss={noop('freemiumPIRBanner_dismiss')}
                action={noop('freemiumPIRBanner_action')}
            />
        ),
    },
};

export const otherFreemiumPIRBannerExamples = {
    'freemiumPIR.big-two-action-overflow': {
        factory: () => (
            <FreemiumPIRBanner
                message={freemiumPIRDataExamples.big_two_action_overflow.content}
                action={noop('freemiumPIRBanner_action')}
                dismiss={noop('freemiumPIRBanner_dismiss')}
            />
        ),
    },
};
