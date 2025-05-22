import { useGlobalSettingsState } from '../global/Providers/SettingsServiceProvider.js';
import { useComputed } from '@preact/signals';

/**
 * @typedef {Object} SwitchDefinition
 * @property {string} valueId
 * @property {import("preact").ComponentChildren} [on]
 * @property {import("preact").ComponentChildren} [off]
 */

/**
 * A component that renders a checkbox with text and optional children
 * @param {SwitchDefinition} props - The component props
 */
export function Switch({ on, off, valueId }) {
    const state = useGlobalSettingsState();
    const computed = useComputed(() => state.value[valueId]);
    console.log('{SwitchDefinition', [computed.value]);
    return computed.value ? on : off;
}
