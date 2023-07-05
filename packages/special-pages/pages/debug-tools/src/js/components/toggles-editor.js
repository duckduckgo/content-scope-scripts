import {
    FeatureToggleListDomainExceptions,
    FeatureToggleListGlobal
} from '../remote-resources/components/feature-toggle-list-global'

/**
 * @typedef{ import('../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef{ import('../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 */

/**
 * @param {object} props
 * @param {any} props.model
 * @param {boolean} props.pending
 * @param {boolean} props.edited
 * @param {boolean} props.invalid
 * @param {RemoteResource} props.resource
 * @param {import('react').ReactNode} props.buttons
 */
export function TogglesEditor (props) {
    return (
        <div data-testid="TogglesEditor">
            <div className="editor__save">
                {props.buttons}
            </div>
            {props.resource.id.startsWith('privacy-configuration') && (
                <>
                    <h2>Global Feature toggles</h2>
                    <FeatureToggleListGlobal {...props} />
                    <br />
                    <h2>Domain Specific</h2>
                    <FeatureToggleListDomainExceptions {...props} />
                </>
            )}
        </div>
    )
}
