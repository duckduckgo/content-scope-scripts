import { ExtendedReasoningIcon, FastReasoningIcon, ReasoningEffortIcon } from './Icons';

/**
 * Returns the icon component for a given reasoning-effort key, or null for unknown keys.
 *
 * The parameter narrows to the schema's current values, but at runtime native may surface a new
 * key before the web app has an icon for it; callers should tolerate `null`.
 *
 * @param {import('../../../../../types/new-tab.js').ReasoningEffort} key
 * @returns {import('preact').ComponentType<import('preact').JSX.SVGAttributes<SVGSVGElement>> | null}
 */
export function getReasoningEffortIcon(key) {
    switch (key) {
        case 'none':
        case 'minimal':
            return FastReasoningIcon;
        case 'low':
            return ReasoningEffortIcon;
        case 'medium':
        case 'high':
            return ExtendedReasoningIcon;
        default: {
            /**
             * Exhaustiveness check — `never` means all ReasoningEffort cases are handled;
             * adding a new one without a case will cause a type error here.
             * @type {never}
             */
            const _exhaustiveCheck = key;
            console.error(`Unknown reasoning effort: ${_exhaustiveCheck}`);
            return null;
        }
    }
}
