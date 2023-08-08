/**
 * @param {object} props
 * @param {(evt: any) => void} props.save
 * @param {boolean} props.pending
 * @param {() => void} props.cancel
 * @param {(args: { className: string }) => import("react").ReactNode} props.input
 */
export function URLEditor (props) {
    function onKeyUp (e) {
        if (e.code === 'Escape') {
            props.cancel()
        }
    }

    return (
        <form className="font-mono text-xs" onSubmit={props.save} onKeyUp={onKeyUp}>
            <label className="inline-form">
                <span className="inline-form__label">NEW: </span>
                <div className="inline-form__control">
                    {props.input({ className: 'inline-form__input' })}
                    <button className="inline-form__button" type="submit">{props.pending ? 'Saving...' : 'Save'}</button>
                    <button className="inline-form__button" type="button" onClick={props.cancel}>Cancel</button>
                </div>
            </label>
        </form>
    )
}
