import { RemoteResourcesContext } from '../remote-resources.page'
import { RemoteResourceState } from './remote-resource-state'
import { MonacoEditor } from '../../components/monaco-editor'
import { MonacoDiffEditor } from '../../components/monaco-diff-editor'
import invariant from 'tiny-invariant'
import { TogglesEditor } from '../../components/toggles-editor'

/**
 * @typedef {import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef {import('../../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 * @typedef {import("../remote-resources.machine").EditorKind} EditorKind
 * @typedef {import("../remote-resources.machine").ToggleKind} ToggleKind
 */

/**
 * @param {object} props
 * @param {RemoteResource} props.resource
 * @param {import("monaco-editor").editor.ITextModel} props.model
 * @param {import("react").ReactNode | null | undefined} props.beforeEditor
 */
export function RemoteResourceEditor (props) {
    const [state, send] = RemoteResourcesContext.useActor()
    const originalContents = props.resource.current.contents

    /** @type {(resp: UpdateResourceParams) => void} */
    const saveNewRemote = resp => send({ type: 'save new remote', payload: resp })
    /** @type {(kind: EditorKind) => void} */
    const setEditorKind = (kind) => send({ type: 'set editor kind', payload: kind })
    /** @type {(kind: ToggleKind) => void} */
    const setToggleKind = (kind) => send({ type: 'set toggle kind', payload: kind })
    /** @type {(domain: string) => void} */
    const setCurrentDomain = (domain) => send({ type: 'set current domain', payload: domain })
    const showOverrideForm = () => send({ type: 'show url editor' })
    const hideOverrideForm = () => send({ type: 'hide url editor' })
    const revertEdited = () => props.model.setValue(originalContents)

    function saveDebugContent () {
        /** @type {UpdateResourceParams} */
        const payload = {
            id: props.resource.id,
            source: {
                debugTools: {
                    content: props.model.getValue()
                }
            }
        }

        send({ type: 'save edited', payload })
    }

    /** @type {(url: string) => void} */
    function setUrl (url) {
        /** @type {UpdateResourceParams} */
        const payload = {
            id: props.resource.id,
            source: {
                remote: {
                    url
                }
            }
        }
        saveNewRemote(payload)
    }

    const savingRemote = state.matches(['showing editor', 'editing', 'saving new remote'])
    const savingChanges = state.matches(['showing editor', 'editing', 'saving edited'])
    const showingUrlEditor = state.matches(['showing editor', 'urlEditor', 'open'])
    const hasEdits = state.matches(['showing editor', 'editing', 'editor has edited content'])
    const contentIsInvalid = state.matches(['showing editor', 'contentErrors', 'some'])

    /** @type {string[]} */
    const validKinds = state.context.currentResource?.editorKinds || []
    const validToggleKinds = state.context.currentResource?.toggleKinds || []
    const nextKind = state.context.editorKind || 'inline'
    const nextToggleKind = state.context.toggleKind || 'global-feature'
    const editorKind = validKinds.includes(nextKind)
        ? nextKind
        : 'inline'
    const toggleKind = validToggleKinds.includes(nextToggleKind)
        ? nextToggleKind
        : 'global-feature'

    const switcherKinds = validKinds.map(v => {
        return {
            value: v,
            label: v[0].toUpperCase() + v.slice(1)
        }
    }) || []

    const editorState = contentIsInvalid ? 'not-allowed' : 'enabled'
    const tabs = state.context.tabs || []
    const currentDomain = state.context.currentDomain

    // Buttons above the editor
    const buttons = <>
        <Switcher kind={editorKind} toggleKind={setEditorKind} values={switcherKinds} />
        <button type="button" className="button" onClick={revertEdited} disabled={!hasEdits}>↩️ Revert</button>
        <button
            className="button"
            type='button'
            onClick={() => saveDebugContent()}
            disabled={!hasEdits}
            data-state={editorState}>{savingChanges ? 'saving...' : '💾 Save + Apply'}
        </button>
    </>

    if (!state.matches(['showing editor', 'editing'])) return null

    return (
        <div>
            <RemoteResourceState
                resource={props.resource}
                pending={savingRemote}
                edited={hasEdits}
                showingUrlEditor={showingUrlEditor}
                setUrl={setUrl}
                showOverrideForm={showOverrideForm}
                hideOverrideForm={hideOverrideForm}
            />
            {props.beforeEditor}
            <InvalidEditorErrors revert={revertEdited} />
            <SavingErrors dismiss={() => send({ type: 'clearErrors' })} />
            <div className="editor">
                {editorKind === 'diff' && <MonacoDiffEditor
                    buttons={buttons}
                    model={props.model}
                    original={originalContents}
                    edited={hasEdits}
                    invalid={contentIsInvalid}
                    pending={savingChanges}
                    id={props.resource.id}
                />}
                {editorKind === 'inline' && <MonacoEditor
                    buttons={buttons}
                    model={props.model}
                    invalid={contentIsInvalid}
                    edited={hasEdits}
                    pending={savingChanges}
                    id={props.resource.id}
                />}
                {editorKind === 'toggles' && <TogglesEditor
                    buttons={buttons}
                    model={props.model}
                    invalid={contentIsInvalid}
                    edited={hasEdits}
                    pending={savingChanges}
                    resource={props.resource}
                    toggleKind={toggleKind}
                    toggleKinds={validToggleKinds}
                    onToggleKind={setToggleKind}
                    tabs={tabs}
                    setCurrentDomain={setCurrentDomain}
                    currentDomain={currentDomain}
                />}
            </div>
        </div>
    )
}

/**
 * Errors that occur from the editor
 */
function InvalidEditorErrors (props) {
    const errors = RemoteResourcesContext.useSelector(state => {
        const errorState = state.matches(['showing editor', 'contentErrors', 'some'])
        if (!errorState) return []
        const markers = state.context.contentMarkers || []
        invariant(Array.isArray(markers), 'Markers must exit and be an array')
        return markers.map(x => {
            return { message: 'line: ' + x.startLineNumber + ' ' + x.message }
        })
    })

    if (errors.length === 0) return null

    return (
        <FloatingErrors errors={errors}>
            <button type="button" className="button" onClick={props.revert}>↩️ Revert</button>
        </FloatingErrors>
    )
}

/**
 * Errors from communications with native sides
 * @param {object} props
 * @param {() => void} props.dismiss
 */
function SavingErrors (props) {
    const error = RemoteResourcesContext.useSelector(state => {
        const errorState = state.matches(['showing editor', 'errors', 'some'])
        if (!errorState) return null
        const error = state.context.error
        invariant(typeof error === 'string', 'at this point, error must be a string')
        return error
    })

    if (error === null) return null

    return (
        <FloatingErrors errors={[{ message: error }]}>
            <button type="button" className="button" onClick={props.dismiss}>↩️ Dismiss</button>
        </FloatingErrors>
    )
}

/**
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @param {{message: string}[]} props.errors
 */
function FloatingErrors (props) {
    return (
        <div className="row error floating">
            <div className="font-bold">{props.errors.length} error{props.errors.length === 1 ? '' : 's'} occurred. </div>
            {props.errors.slice(0, 3).map((m) => {
                return (
                    <div key={m.message} className="row">{m.message}</div>
                )
            })}
            <div className="row">
                {props.children}
            </div>
        </div>
    )
}

/**
 * @param {object} props
 * @param {{value: string; label: string}[]} props.values
 * @param {'diff' | 'inline' | 'toggles'} props.kind
 * @param {(kind: 'diff' | 'inline' | 'toggles') => void} props.toggleKind
 */
function Switcher (props) {
    return (
        <label className="inline-select">
            <span className="inline-select__label">Editor kind: </span>
            <select className="inline-select__select" value={props.kind} onChange={(e) => props.toggleKind(/** @type {any} */(e.target.value))}>
                {props.values.map(value => {
                    return (
                        <option value={value.value} key={value.value}>{value.label}</option>
                    )
                })}
            </select>
        </label>
    )
}
