import { RemoteResourcesContext } from '../remote-resources.page'
import { RemoteResourceState } from './remote-resource-state'
import { MonacoEditor } from '../../components/monaco-editor'
import { MonacoDiffEditor } from '../../components/monaco-diff-editor'
import invariant from 'tiny-invariant'
import { TogglesEditor } from '../../components/toggles-editor'
import { PatchesEditor } from '../../components/patches-editor'
import styles from '../../app/components/app.module.css'
import {SubNav} from "../../app/components/feature-nav";
import {useRef} from "react";
import {Button} from "../../components/buttons";

/**
 * @typedef {import('../../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef {import('../../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 * @typedef {import("../remote-resources.machine").EditorKind} EditorKind
 * @typedef {import("../remote-resources.machine").ToggleKind} ToggleKind
 * @typedef {import('../../app/components/feature-nav').SubNavItem} SubNavItem
 */

/**
 * @param {object} props
 * @param {RemoteResource} props.resource
 * @param {import("monaco-editor").editor.ITextModel} props.model
 * @param {SubNavItem[]} props.nav
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
    const showOverrideForm = () => send({ type: 'show url editor' })
    const copyPatch = () => {
        state.children.patches?.send({ type: 'COPY_TO_CLIPBOARD' })
    }
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

    /**
     * @param {'save' | 'revert' | 'show-diff'} action
     */
    function localAction(action) {
        switch (action) {
            case "revert": {
                revertEdited()
                break
            }
            case "save": {
                saveDebugContent()
                break
            }
            case "show-diff": {
                setEditorKind('diff');
                break
            }
        }
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

    // Buttons above the editor
    const buttons = <>
        <Button onClick={() => localAction("revert")} disabled={!hasEdits}>↩️ Revert</Button>
        <Button
            onClick={() => localAction('save')}
            disabled={!hasEdits}
            data-state={editorState}>{savingChanges ? 'saving...' : '💾 Save + Apply'}
        </Button>
    </>

    const other = useRef(null);

    if (!state.matches(['showing editor', 'editing'])) return null

    return (
        <>
            <main className={styles.appMain}>
                <InvalidEditorErrors revert={() => localAction('revert')} />
                <SavingErrors dismiss={() => send({ type: 'clearErrors' })} />

                <div className={styles.mainHeader}>

                    {props.nav.length > 1
                        ? (
                            <div className="row">
                                <SubNav items={props.nav} prefix={'/remoteResources/'}/>
                            </div>
                        )
                        : null
                    }
                    <RemoteResourceState
                        resource={props.resource}
                        pending={savingRemote}
                        edited={hasEdits}
                        showingUrlEditor={showingUrlEditor}
                        setUrl={setUrl}
                        editorKind={editorKind}
                        showOverrideForm={showOverrideForm}
                        hideOverrideForm={hideOverrideForm}
                        copyPatch={copyPatch}
                        model={props.model}
                        localAction={localAction}
                    />
                </div>

                <div className={styles.mainContent}>
                    {editorKind === 'diff' && <MonacoDiffEditor
                        model={props.model}
                        original={originalContents}
                        edited={hasEdits}
                        invalid={contentIsInvalid}
                        pending={savingChanges}
                        id={props.resource.id}
                        other={other.current}
                    />}
                    {editorKind === 'inline' && <MonacoEditor
                        model={props.model}
                        invalid={contentIsInvalid}
                        edited={hasEdits}
                        pending={savingChanges}
                        id={props.resource.id}
                    />}
                    {editorKind === 'toggles' && <TogglesEditor
                        model={props.model}
                        invalid={contentIsInvalid}
                        edited={hasEdits}
                        pending={savingChanges}
                        resource={props.resource}
                        toggleKind={toggleKind}
                        toggleKinds={validToggleKinds}
                        onToggleKind={setToggleKind}
                    />}
                    {editorKind === 'patches' && <PatchesEditor
                        model={props.model}
                        pending={savingChanges}
                        edited={hasEdits}
                        invalid={contentIsInvalid}
                        resource={props.resource}
                    />}
                </div>
            </main>
            <footer className={styles.appFooter}>
                <div className="flex column-gap">
                    <div className="flex column-gap">
                        <Switcher kind={editorKind} toggleKind={setEditorKind} values={switcherKinds} />
                    </div>
                    <div className="flex column-gap" ref={other} />
                    <div className="flex column-gap ml-auto">
                        {buttons}
                    </div>
                </div>
            </footer>
        </>
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
            <Button onClick={props.revert}>↩️ Revert</Button>
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
            <Button onClick={props.dismiss}>↩️ Dismiss</Button>
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
 * @param {EditorKind} props.kind
 * @param {(kind: EditorKind) => void} props.toggleKind
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
