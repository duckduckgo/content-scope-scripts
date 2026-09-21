import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { DEFAULT_ANTHROPIC_MODEL, DEFAULT_REVIEW_MODEL, resolveAnthropicModel, resolveReviewModel } from './anthropic-config.mjs';

test('resolveAnthropicModel falls back to the default model', () => {
    assert.equal(resolveAnthropicModel({}), DEFAULT_ANTHROPIC_MODEL);
});

test('resolveAnthropicModel prefers ANTHROPIC_MODEL', () => {
    assert.equal(resolveAnthropicModel({ ANTHROPIC_MODEL: 'claude-test' }), 'claude-test');
});

test('resolveReviewModel falls back to the review default', () => {
    assert.equal(resolveReviewModel({}), DEFAULT_REVIEW_MODEL);
});

test('resolveReviewModel prefers ANTHROPIC_REVIEW_MODEL over ANTHROPIC_MODEL', () => {
    assert.equal(resolveReviewModel({ ANTHROPIC_REVIEW_MODEL: 'claude-review', ANTHROPIC_MODEL: 'claude-shared' }), 'claude-review');
});

test('resolveReviewModel honours a shared ANTHROPIC_MODEL override', () => {
    assert.equal(resolveReviewModel({ ANTHROPIC_MODEL: 'claude-shared' }), 'claude-shared');
});
