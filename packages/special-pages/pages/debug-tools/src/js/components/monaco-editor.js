import * as monaco from 'monaco-editor'
import {useEffect, useLayoutEffect, useRef} from 'react'
import invariant from 'tiny-invariant'

/**
 * @typedef {import('../../../schema/__generated__/schema.types').RemoteResource} RemoteResource
 * @typedef {import('../../../schema/__generated__/schema.types').UpdateResourceParams} UpdateResourceParams
 * @typedef {import('monaco-editor').editor.ITextModel} ITextModel
 */

/**
 * @param {object} props
 * @param {any} props.model
 * @param {boolean} props.pending
 * @param {boolean} props.edited
 * @param {boolean} props.invalid
 * @param {string} props.id
 */
export function MonacoEditor (props) {
    const ref = useRef(null)

    useEffect(() => {
        invariant(ref.current, 'ref must exist here')

        const editor = monaco.editor.create(ref.current, {
            model: props.model,
            automaticLayout: true
        })

        const prev = localStorage.getItem('viewState_' + props.id)
        if (prev) {
            editor.restoreViewState(JSON.parse(prev))
        }

        // todo(Shane): move this from the component
        const int = setInterval(() => {
            localStorage.setItem('viewState_' + props.id, JSON.stringify(editor.saveViewState()))
        }, 1000)

        return () => {
            clearInterval(int)
            editor?.dispose()
        }
    }, [props.model])

    return (
        <div ref={ref} style={{height: '100%', width: '100%'}}></div>
    )
}

/**
 * @param {object} props
 * @param {ITextModel} props.model
 */
export function MonacoEditorRaw (props) {
    const ref = useRef(null)

    useEffect(() => {
        invariant(ref.current, 'ref must exist here')

        const editor = monaco.editor.create(ref.current, {
            model: props.model
        })

        return () => {
            editor?.dispose()
        }
    }, [props.model])

    return (
        <div ref={ref} style={{ height: '100%', width: '100%' }}></div>
    )
}
