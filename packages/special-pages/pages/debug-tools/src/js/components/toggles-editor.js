import {
    FeatureToggleListGlobal
} from '../remote-resources/components/feature-toggle-list-global'
import { FeatureToggleListDomainExceptions } from '../remote-resources/components/feature-toggle-list-domain-exceptions'
import { UnprotectedDomains } from '../remote-resources/components/unprotected-domains'

/**
 * @typedef {import('../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef {import('../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 * @typedef {import('../remote-resources/remote-resources.machine').ToggleKind} ToggleKind
 * @typedef {import('../types').TabWithHostname} TabWithHostname
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 * @typedef {import('react').ReactNode} ReactNode
 */

/**
 * @typedef ToggleComponentProps
 * @property {ITextModel} model
 */

/** @type {Record<ToggleKind, string>} */
const titles = {
    'global-feature': 'Global Feature Toggles',
    'domain-exceptions': 'Domain Exceptions',
    unprotected: 'Unprotected Domains'
}

/** @type {Record<ToggleKind, (props: ToggleComponentProps) => ReactNode>} */
const components = {
    'global-feature': (props) => <FeatureToggleListGlobal {...props}/>,
    // 'domain-exceptions': (props) => <FeatureToggleListDomainExceptions {...props} />
    'domain-exceptions': (props) => <FeatureToggleListDomainExceptions {...props} />,
    unprotected: (props) => <UnprotectedDomains {...props} />
}

/**
 * @param {object} props
 * @param {ITextModel} props.model
 * @param {boolean} props.pending
 * @param {boolean} props.edited
 * @param {boolean} props.invalid
 * @param {(kind: ToggleKind) => void} props.onToggleKind
 * @param {ToggleKind} props.toggleKind
 * @param {ToggleKind[]} props.toggleKinds
 * @param {RemoteResource} props.resource
 * @param {ReactNode} props.buttons
 */
export function TogglesEditor (props) {
    return (
        <div data-testid="TogglesEditor">
            <div className="editor__save">
                {props.buttons}
            </div>
            <div className="radio-group row">
                <form className="radio-group__form">
                    {props.toggleKinds.map(toggle => {
                        return (
                            <div key={toggle} className="radio-group__item">
                                <label className="radio-group__label" data-state={toggle === props.toggleKind ? 'active' : 'inactive'}>
                                    <input type="radio"
                                        className="radio-group__input"
                                        onChange={() => props.onToggleKind(toggle)}
                                        checked={toggle === props.toggleKind}/>
                                    <span className="radio-group__title">{titles[toggle]}</span>
                                </label>
                            </div>
                        )
                    })}
                </form>
            </div>
            <div className="row">{components[props.toggleKind](props)}</div>
        </div>
    )
}
