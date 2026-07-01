/**
 * Shared Anthropic model configuration for CI LLM judges.
 *
 * Override per workflow via the ANTHROPIC_MODEL env var. Keep the default
 * current — see https://platform.claude.com/docs/en/about-claude/model-deprecations
 */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';
export const DEFAULT_SEMVER_ANTHROPIC_MODEL = 'claude-sonnet-5';

/** @param {NodeJS.ProcessEnv} [env] */
export function resolveAnthropicModel(env = process.env) {
    return env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;
}

/** @param {NodeJS.ProcessEnv} [env] */
export function resolveSemverAnthropicModel(env = process.env) {
    return env.ANTHROPIC_MODEL || DEFAULT_SEMVER_ANTHROPIC_MODEL;
}
