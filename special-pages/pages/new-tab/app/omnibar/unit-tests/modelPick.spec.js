import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { resolveImageGenerationModel, resolveModel, resolveReasoningEffort } from '../components/modelPick.js';

/** @typedef {import('../components/modelPick.js').AIModelItem} AIModelItem */

/** @type {AIModelItem} */
const haiku = { id: 'haiku', name: 'Haiku', shortName: 'Haiku', isAvailable: true, supportsImageUpload: false };
/** @type {AIModelItem} */
const gated = { id: 'gated', name: 'Gated', shortName: 'Gated', isAvailable: false, supportsImageUpload: false };
/** @type {AIModelItem} */
const painter = {
    id: 'painter',
    name: 'Painter',
    shortName: 'Painter',
    isAvailable: true,
    supportsImageUpload: true,
    supportedTools: ['GenerateImage'],
    reasoningEfforts: [
        { id: 'none', name: 'Fast', isAvailable: true },
        { id: 'low', name: 'Reasoning', isAvailable: true },
        { id: 'high', name: 'Deep', isAvailable: false },
    ],
};
const models = [gated, haiku, painter];

test('resolveModel falls back to the first available model', () => {
    equal(resolveModel(models, 'painter'), painter);
    equal(resolveModel(models, 'gated'), haiku);
    equal(resolveModel(models, 'unknown'), haiku);
    equal(resolveModel(models, undefined), haiku);
    equal(resolveModel([gated], 'gated'), null);
});

test('resolveReasoningEffort keeps an offered effort, else takes the first offered one', () => {
    equal(resolveReasoningEffort(painter, 'low'), 'low');
    equal(resolveReasoningEffort(painter, 'high'), 'none');
    equal(resolveReasoningEffort(painter, undefined), 'none');
    equal(resolveReasoningEffort(haiku, 'low'), null);
    equal(resolveReasoningEffort(null, 'low'), null);
});

test('resolveImageGenerationModel keeps a model that creates images, else uses the preferred one', () => {
    equal(resolveImageGenerationModel(painter, models, 'haiku'), painter);
    equal(resolveImageGenerationModel(haiku, models, 'painter'), painter);
    equal(resolveImageGenerationModel(haiku, models, 'gated'), haiku);
    equal(resolveImageGenerationModel(haiku, models, undefined), haiku);
});
