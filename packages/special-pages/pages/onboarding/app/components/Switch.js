import { h } from 'preact'

export function Switch ({ pending, checked = false, onChecked, onUnchecked }) {
    function change (e) {
        if (e.target.checked === true) {
            onChecked()
        } else {
            onUnchecked()
        }
    }
    return (
        <label><input disabled={pending} type="checkbox" checked={checked} onChange={change} /></label>
    )
}
