import './styles.css'
import styles from './toggle-list.module.css'
import {Switch} from "./switch";
import invariant from "tiny-invariant";

/**
 * @typedef ToggleListItem
 * @property {string} title
 * @property {string} id
 * @property {'on' | 'off' | 'disabled'} globalState
 * @property {'on' | 'off' | 'disabled' | undefined} domainState
 * @property {string | undefined} targetDomain
 */


/**
 * @template {ToggleListItem} T
 * @param {object} props
 * @param {(id: string) => void} props.onClick
 * @param {(id: string, domain: string) => void} props.onClickDomain
 * @param {T[]} props.items
 * @param {string | undefined} props.domain
 * @param {(item: T) => import("react").ReactNode} [props.renderInfo]
 * @param {import("react").ReactNode} [props.children]
 */
export function ToggleList(props) {
    /**
     * @param {import('react').ChangeEvent<HTMLInputElement>} e
     */
    const onClick = (e) => {
        if (!(e.target instanceof HTMLInputElement)) return
        console.log(e.target.checked, e.target.value);
        props.onClick(e.target.value)
    }

    /**
     * @param e
     * @param {string} domain
     */
    const onClickDomain = (e, domain) => {
        if (!(e.target instanceof HTMLInputElement)) return
        props.onClickDomain(e.target.value, domain)
    }
    return (
        <table>
            <thead>
            <tr>
                <th className="p-4 text-left text-sm">Feature Name</th>
                <th className="p-4 text-left text-sm">Global</th>
                {props.domain && (
                    <>
                        <th className="p-4 text-left text-sm"><code>{props.domain}</code></th>
                    </>
                )}
            </tr>
            </thead>
            <tbody>
            {props.items.map(item => {
                return (
                    <tr key={item.id} className={styles.listItem} data-state={item.globalState}>
                        <td className="px-4">{item.title}</td>
                        <td className="px-4">
                            <Switch
                                checked={item.globalState === 'on'}
                                onChange={onClick}
                                id={item.id}
                                disabled={item.globalState === 'disabled'}>
                                {item.title}
                            </Switch>
                        </td>
                        {props.domain && (
                            <td className="px-4">
                                {('domainState' in item) && (
                                    <Switch
                                        checked={item.domainState === 'on'}
                                        onChange={(e) => {
                                            invariant(item.targetDomain, 'item.targetDomain missing')
                                            onClickDomain(e, item.targetDomain);
                                        }}
                                        id={item.id}
                                        disabled={item.domainState === 'disabled'}>
                                        {item.title}
                                    </Switch>
                                )}
                            </td>
                        )}
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}

