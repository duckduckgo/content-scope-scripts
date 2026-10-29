/**
 * A minimal cost-axis run: two detectors on different ticks, on a page where a body-wide
 * text read has real work to do. Exercises expansion, the empty floor and the cost reports
 * end to end.
 */
import { scriptHeavy } from '../page-gen/pages.mjs';

export default {
    kind: 'cost',
    iterations: 3,
    warmup: 1,

    detectors: {
        tests: {
            bodyText: {
                match: { text: { pattern: ['never present on this page'] } },
                triggers: { auto: { state: 'enabled', when: { intervalMs: [500] } } },
            },
            element: {
                match: { element: { selector: '#never-present' } },
                triggers: { auto: { state: 'enabled', when: { intervalMs: [500, 3000] } } },
            },
        },
    },

    // No `expect`: the cost axis needs none.
    fixtures: [{ name: 'script-heavy', generate: scriptHeavy, params: { scriptBlocks: 10, scriptRepeat: 200 } }],
};
