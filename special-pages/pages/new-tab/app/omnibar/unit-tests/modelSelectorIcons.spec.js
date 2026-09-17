import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { resolveModelIconKey } from '../components/chat-tools/model-selector/modelIconMap.js';

test.describe('resolveModelIconKey', () => {
    test('maps provider prefixes to the expected icon key', () => {
        equal(resolveModelIconKey('meta-llama-3-70b'), 'llama');
        equal(resolveModelIconKey('mistral-small-3'), 'mistral');
        equal(resolveModelIconKey('claude-haiku-4-5'), 'claude');
        equal(resolveModelIconKey('gpt-4o-mini'), 'openai');
        equal(resolveModelIconKey('openai_gpt-4o'), 'openai');
    });

    test('maps open-weight models to the OSS icon key', () => {
        equal(resolveModelIconKey('openai_gpt-oss-120b'), 'oss');
        equal(resolveModelIconKey('tinfoil/gemma4-31b'), 'oss');
    });

    test('is case-insensitive', () => {
        equal(resolveModelIconKey('Claude-3-5-Sonnet'), 'claude');
        equal(resolveModelIconKey('TINFOIL/gemma4-31b'), 'oss');
    });

    test('returns null for unknown model ids', () => {
        equal(resolveModelIconKey('unknown-provider/model'), null);
    });
});
