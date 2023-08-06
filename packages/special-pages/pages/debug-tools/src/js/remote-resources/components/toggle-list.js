import * as z from 'zod'
import './styles.css'

/**
 * @typedef ToggleListItem
 * @property {string} title
 * @property {string} id
 * @property {'on' | 'off' | 'disabled'} state
 */

const iconMap = {
    on: '✅',
    off: '❌',
    disabled: '🚫'
}

/**
 * @template {ToggleListItem} T
 * @param {object} props
 * @param {(id: string) => void} props.onClick
 * @param {T[]} props.items
 * @param {Partial<typeof iconMap>} [props.icons]
 * @param {(item: T) => import("react").ReactNode} [props.renderInfo]
 * @param {import("react").ReactNode} [props.children]
 */
export function ToggleList (props) {
    const onClick = (e) => {
        if (!(e.target instanceof HTMLButtonElement)) return
        const parsed = z.object({ id: z.string() }).parse(e.target.dataset)
        props.onClick(parsed.id)
    }
    const icons = {
        ...iconMap,
        ...props.icons
    }
    return <div>
        <ul onClick={onClick} className="toggle-list">
            {props.items.map(item => {
                return (
                    <li key={item.id} className="toggle-list__item" data-state={item.state}>
                        <button type="button"
                            className="toggle-list__button"
                            data-id={item.id}
                            data-state={item.state}
                            aria-label={'toggle ' + item.id}>
                            {item.state === 'on' && icons.on}
                            {item.state === 'off' && icons.off}
                            {item.state === 'disabled' && icons.disabled}
                        </button>
                        <div className="toggle-list__title">
                            <span>{item.title}</span>
                        </div>
                        {props.renderInfo
                            ? (
                                <div>
                                    {props.renderInfo(item)}
                                </div>

                            )
                            : null}

                    </li>
                )
            })}
        </ul>
        {props.children}
    </div>
}