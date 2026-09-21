/**
 * Shared Anthropic model configuration for CI LLM judges.
 *
 * Override per workflow via the ANTHROPIC_MODEL env var. Keep the defaults
 * current — see https://platform.claude.com/docs/en/about-claude/model-deprecations
 */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-5';

/**
 * Reviewing a real diff is a harder judgement call than scoring an existing
 * review, so the PR reviewer defaults to a stronger model than the merge
 * gate. ANTHROPIC_REVIEW_MODEL overrides it on its own; ANTHROPIC_MODEL
 * overrides both together.
 */
export const DEFAULT_REVIEW_MODEL = 'claude-opus-5';

/** @param {NodeJS.ProcessEnv} [env] */
export function resolveAnthropicModel(env = process.env) {
    return env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;
}

/** @param {NodeJS.ProcessEnv} [env] */
export function resolveReviewModel(env = process.env) {
    return env.ANTHROPIC_REVIEW_MODEL || env.ANTHROPIC_MODEL || DEFAULT_REVIEW_MODEL;
}
