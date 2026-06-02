/**
 * Shared serialization for the Event Hub "experiments" pixel parameter.
 *
 * The Event Hub allows pixels to carry experiment cohort information so that
 * aggregate detection counts can be attributed per cohort. The parameter value
 * is a JSON object keyed by experiment name:
 *
 * ```json
 * {
 *   "tdsNextExperiment008": { "cohort": "treatment", "changedInPeriod": true },
 *   "contentScopeExperiment4": { "cohort": "control" }
 * }
 * ```
 *
 * When the client belongs to no (matching) experiment the value is the empty
 * object `{}`. `changedInPeriod` is only present when the user joined, left, or
 * switched cohort during the aggregation period and is otherwise omitted.
 *
 * This module is the canonical definition of that format. Aggregation timing and
 * period state are owned natively (e.g. the Android Event Hub), but the
 * percent-encoded JSON shape is identical across platforms, so platforms that
 * compute experiment data client-side reuse this helper.
 */

/**
 * A single experiment cohort assignment.
 *
 * @typedef {object} ExperimentAssignment
 * @property {string} name - The experiment name (e.g. "contentScopeExperiment4").
 * @property {string} cohort - The assigned cohort name (e.g. "treatment").
 * @property {boolean} [changedInPeriod] - Whether the assignment changed during the aggregation period.
 */

/**
 * The serialized value of an experiments parameter, keyed by experiment name.
 *
 * @typedef {Record<string, { cohort: string, changedInPeriod?: boolean }>} ExperimentsParameter
 */

/**
 * Build the value for an Event Hub "experiments" parameter.
 *
 * @param {ExperimentAssignment[]} assignments - The experiment cohort assignments to consider.
 * @param {string} [matchExperiments] - Optional regular expression matched against the experiment
 *   name. Only experiments whose name matches are included. When omitted, all assignments are included.
 * @returns {ExperimentsParameter} The experiments parameter object (empty when nothing matches).
 */
export function buildExperimentsParameter(assignments, matchExperiments) {
    /** @type {RegExp | null} */
    let regex = null;
    if (matchExperiments) {
        try {
            regex = new RegExp(matchExperiments);
        } catch {
            // An invalid pattern matches nothing rather than throwing during pixel assembly.
            return {};
        }
    }

    /** @type {ExperimentsParameter} */
    const result = {};
    for (const assignment of assignments) {
        if (!assignment?.name || !assignment.cohort) continue;
        if (regex && !regex.test(assignment.name)) continue;

        /** @type {{ cohort: string, changedInPeriod?: boolean }} */
        const entry = { cohort: assignment.cohort };
        if (assignment.changedInPeriod) {
            entry.changedInPeriod = true;
        }
        result[assignment.name] = entry;
    }
    return result;
}
