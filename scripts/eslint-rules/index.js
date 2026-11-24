/**
 * Local ESLint rules for this repo, wired up in `eslint.config.js`.
 *
 * Rules live here rather than in `@duckduckgo/eslint-config` because they
 * encode C-S-S specific architecture (the feature lifecycle, the messaging
 * layer) that other repos don't share.
 */
import { noBlockingInitRequest } from './no-blocking-init-request.js';

export default {
    meta: {
        name: 'ddg-local',
    },
    rules: {
        'no-blocking-init-request': noBlockingInitRequest,
    },
};
