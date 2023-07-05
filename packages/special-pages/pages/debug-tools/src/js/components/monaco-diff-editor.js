import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

/**
 * @param {object} props
 * @param {string} props.original
 * @param {any} props.model
 * @param {boolean} props.pending
 * @param {boolean} props.edited
 * @param {boolean} props.invalid
 * @param {string} props.id
 * @param {import('react').ReactNode} props.buttons
 */
export function MonacoDiffEditor (props) {
    const ref = useRef(null)
    const editorRefs = /** @type {import('react').MutableRefObject} */(useRef({}))

    useEffect(() => {
        if (!ref.current) throw new Error('unreachable')
        const originalModel = monaco.editor.createModel(
            props.original,
            'application/json'
        )

        const diffEditor = monaco.editor.createDiffEditor(
            ref.current,
            {
                originalEditable: false,
                automaticLayout: true
            }
        )

        diffEditor.setModel({
            original: originalModel,
            modified: props.model
        })

        editorRefs.current.navi = monaco.editor.createDiffNavigator(diffEditor, {
            followsCaret: true, // resets the navigator state when the user selects something in the editor
            ignoreCharChanges: true // jump from line to line
        })

        const prev = localStorage.getItem('viewState_' + props.id)
        if (prev) {
            const prevJson = JSON.parse(prev)
            prevJson.original = prevJson
            prevJson.modified = prevJson
            diffEditor.restoreViewState(prevJson)
        }

        // todo(Shane): move this from the component
        const int = setInterval(() => {
            localStorage.setItem('viewState_' + props.id, JSON.stringify(diffEditor.saveViewState()?.modified))
        }, 1000)

        return () => {
            clearInterval(int)
            originalModel.dispose()
            diffEditor.dispose()
            editorRefs.current.navi.dispose()
        }
    }, [props.model, props.original])

    function prevDiff () {
        editorRefs.current.navi.previous()
    }

    function nextDiff () {
        editorRefs.current.navi.next()
    }

    return (
        <div>
            <div className="editor__save">
                {props.buttons}
                <button className="button" type={'button'} onClick={prevDiff} disabled={!props.edited}>⏪{' '}prev diff</button>
                <button className="button" type={'button'} onClick={nextDiff} disabled={!props.edited}>next diff ⏭️</button>
            </div>
            <div ref={ref} style={{
                height: '700px',
                width: '100%'
            }}></div>
        </div>
    )
}
