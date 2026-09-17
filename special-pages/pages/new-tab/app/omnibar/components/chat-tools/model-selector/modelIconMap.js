/**
 * @typedef {'llama' | 'mistral' | 'oss' | 'claude' | 'openai'} ModelIconKey
 */

/**
 * Resolves which icon to show for a model ID, using the same provider-matching
 * logic as apple-browsers' AIChatModel.ModelProvider.from(id:providerString:).
 *
 * Native maps the `tinfoil` provider (which hosts open models such as
 * gpt-oss and Gemma) to the OSS icon via the provider string. We only
 * receive the model ID here, so we detect the `tinfoil` id prefix instead.
 *
 * @param {string} modelId
 * @returns {ModelIconKey | null}
 */
export function resolveModelIconKey(modelId) {
    const normalizedModelId = modelId.toLowerCase();

    if (normalizedModelId.startsWith('meta-llama')) return 'llama';
    if (normalizedModelId.startsWith('mistral')) return 'mistral';
    if (normalizedModelId.includes('gpt-oss') || normalizedModelId.startsWith('tinfoil')) return 'oss';
    if (normalizedModelId.startsWith('claude')) return 'claude';
    if (normalizedModelId.startsWith('gpt') || normalizedModelId.startsWith('openai')) return 'openai';
    return null;
}
