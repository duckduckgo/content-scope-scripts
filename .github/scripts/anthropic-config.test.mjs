import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_ANTHROPIC_MODEL, resolveAnthropicModel } from './anthropic-config.mjs';

const RETIRED_MODELS = new Set(['claude-sonnet-4-20250514', 'claude-opus-4-20250514']);

test('default anthropic model is not a known retired model', () => {
    assert.ok(!RETIRED_MODELS.has(DEFAULT_ANTHROPIC_MODEL));
});

test('resolveAnthropicModel prefers ANTHROPIC_MODEL env var', () => {
    assert.equal(resolveAnthropicModel({ ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001' }), 'claude-haiku-4-5-20251001');
    assert.equal(resolveAnthropicModel({}), DEFAULT_ANTHROPIC_MODEL);
});
