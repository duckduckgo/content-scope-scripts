import { h } from 'preact';
import { noop } from '../../utils.js';
import { FreemiumPIRBanner } from './FreemiumPIRBanner.js';
import { freemiumPIRDataExamples } from '../mocks/freemiumPIRBanner.data.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const FreemiumPIRBannerExamples = {
    'freemiumPIR.small': {
        factory: () => <FreemiumPIRBanner message={freemiumPIRDataExamples.small.content} dismiss={noop('freemiumPIR_dismiss')} />,
    },
    'freemiumPIR.medium': {
        factory: () => <FreemiumPIRBanner message={freemiumPIRDataExamples.medium.content} dismiss={noop('freemiumPIR_dismiss')} />,
    },
    'freemiumPIR.big-single-action': {
        factory: () => (
            <FreemiumPIRBanner
                message={freemiumPIRDataExamples.unused.content}
                action={noop('freemiumPIR_action')}
                dismiss={noop('freemiumPIR_dismiss')}
            />
        ),
    },
    'freemiumPIR.big-two-action': {
        factory: () => (
            <FreemiumPIRBanner
                message={freemiumPIRDataExamples.used.content}
                action={noop('freemiumPIR_action')}
                dismiss={noop('freemiumPIR_dismiss')}
            />
        ),
    },
};

export const otherFreemiumPIRBannerExamples = {
    'freemiumPIR.big-two-action-overflow': {
        factory: () => (
            <FreemiumPIRBanner
                message={freemiumPIRDataExamples.big_two_action_overflow.content}
                action={noop('freemiumPIR_action')}
                dismiss={noop('freemiumPIR_dismiss')}
            />
        ),
    },
};
