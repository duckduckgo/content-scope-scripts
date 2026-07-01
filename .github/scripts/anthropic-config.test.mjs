import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    DEFAULT_ANTHROPIC_MODEL,
    DEFAULT_SEMVER_ANTHROPIC_MODEL,
    resolveAnthropicModel,
    resolveSemverAnthropicModel,
} from './anthropic-config.mjs';

test('resolveAnthropicModel prefers ANTHROPIC_MODEL env var', () => {
    assert.equal(resolveAnthropicModel({ ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001' }), 'claude-haiku-4-5-20251001');
    assert.equal(resolveAnthropicModel({}), DEFAULT_ANTHROPIC_MODEL);
});

test('resolveSemverAnthropicModel defaults to Sonnet 5', () => {
    assert.equal(resolveSemverAnthropicModel({ ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001' }), 'claude-haiku-4-5-20251001');
    assert.equal(resolveSemverAnthropicModel({}), DEFAULT_SEMVER_ANTHROPIC_MODEL);
});
