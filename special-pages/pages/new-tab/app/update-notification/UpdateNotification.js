import { h } from 'preact'
import { useContext, useId, useState } from 'preact/hooks'
import { UpdateNotificationContext } from "./UpdateNotificationProvider.js";

/**
  * @param {object} props
  * @param {string[]} props.notes
  * @param {string} props.version
  * @param {() => void} [props.dismiss]
  */

export function UpdateNotification ({ notes, dismiss, version }) {
    const id = useId();
    const [visible, show] = useState(false);
    const href = `#${id}whats-new`;
    const whatsNewLink = notes.length > 0 ? <span>See <a href={href} onClick={() => show(prev => !prev)}>what's new</a> in this release</span> : null;

    return (
        <div>
            <p>Browser Updated to version {version}. {whatsNewLink}</p>
            <div id={href} hidden={!visible}>
                {notes.map((note, index) => {
                    return <div key={note+index}>{note}</div>
                })}
            </div>
            <button onClick={dismiss}>Dismiss</button>
        </div>
    )
}

export function UpdateNotificationConsumer() {
    const {state, dismiss} = useContext(UpdateNotificationContext)

    // `state.data.content` can be empty - meaning there's no message to display!
    if (state.status === 'ready' && state.data.content) {
        return (
            <UpdateNotification
                notes={state.data.content.notes}
                version={state.data.content.version}
                dismiss={dismiss}
            />
        )
    }
    return null
}
