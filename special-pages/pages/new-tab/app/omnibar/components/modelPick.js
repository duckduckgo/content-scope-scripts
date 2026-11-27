/**
 * @typedef {import('../../../types/new-tab.js').AIModelSections[number]['items'][number]} AIModelItem
 * @typedef {import('../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 * @typedef {{ modelId?: string, reasoningEffort?: ReasoningEffort }} ModelPick - what one tab picked; a missing field uses the default
 */

/**
 * The available model with `modelId`, else the first available one.
 * @param {AIModelItem[]} models
 * @param {string|null|undefined} modelId
 * @returns {AIModelItem | null}
 */
export function resolveModel(models, modelId) {
    const match = modelId ? models.find((model) => model.id === modelId && model.isAvailable) : null;
    return match ?? models.find((model) => model.isAvailable) ?? null;
}

/**
 * `effort` when `model` offers it, else the model's first available effort.
 * @param {AIModelItem | null | undefined} model
 * @param {ReasoningEffort | null | undefined} effort
 * @returns {ReasoningEffort | null}
 */
export function resolveReasoningEffort(model, effort) {
    const availableEfforts = (model?.reasoningEfforts ?? []).filter((option) => option.isAvailable).map((option) => option.id);
    if (effort != null && availableEfforts.includes(effort)) return effort;
    return availableEfforts[0] ?? null;
}

/**
 * The model Create Image uses: `model` when it can create images, else the native-preferred image model.
 * @param {AIModelItem | null} model
 * @param {AIModelItem[]} models
 * @param {string|null|undefined} preferredModelId
 * @returns {AIModelItem | null}
 */
export function resolveImageGenerationModel(model, models, preferredModelId) {
    if (model?.isAvailable && model.supportedTools?.includes('GenerateImage')) return model;
    return models.find((candidate) => candidate.id === preferredModelId && candidate.isAvailable) ?? model;
}
