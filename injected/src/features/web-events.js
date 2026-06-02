import ContentFeature from '../content-feature.js';
import { buildExperimentsParameter } from './web-events/experiments.js';

const MSG_WEB_EVENT = 'webEvent';

export class WebEvents extends ContentFeature {
    _exposedMethods = this._declareExposedMethods(['fireEvent', 'getExperiments']);

    init() {}

    /**
     * Forward a web event to the client via messaging.
     *
     * Other features (e.g. webDetection) call this via:
     * ```js
     * this.callFeatureMethod('webEvents', 'fireEvent', { type: 'adwall' });
     * ```
     *
     * @param {{ type: string, data?: Record<string, unknown> }} event
     */
    fireEvent({ type, data = {} }) {
        this.messaging.notify(MSG_WEB_EVENT, { type, data });
    }

    /**
     * Return the currently-assigned experiment cohorts in the canonical Event Hub
     * "experiments" parameter shape, optionally filtered by a regex on the experiment name.
     *
     * Cohort assignments are sourced from the `currentCohorts` provided by the client. Note
     * that aggregation-period state (and therefore `changedInPeriod`) is owned natively, so
     * this client-side view never sets `changedInPeriod`.
     *
     * @param {{ matchExperiments?: string }} [options]
     * @returns {import('./web-events/experiments.js').ExperimentsParameter}
     */
    getExperiments({ matchExperiments } = {}) {
        const currentCohorts = this.args?.currentCohorts ?? [];
        const assignments = currentCohorts.map((entry) => ({ name: entry.subfeature, cohort: entry.cohort }));
        return buildExperimentsParameter(assignments, matchExperiments);
    }
}

export default WebEvents;
