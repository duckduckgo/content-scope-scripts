import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { WidgetConfigContext } from '../widget-list/widget-config.provider.js'
import styles from './Customizer.module.css'

export function Customizer () {
    const { widgets, widgetConfigItems, toggle } = useContext(WidgetConfigContext)
    return (
        <div class={styles.root}>
            <ul class={styles.list}>
                {widgets.map((widget) => {
                    const matchingConfig = widgetConfigItems.find(item => item.id === widget.id)
                    if (!matchingConfig) {
                        console.warn('missing config for widget: ', widget)
                        return null
                    }
                    return (
                        <li key={widget.id} class={styles.item}>
                            <label class={styles.label}>
                                <input
                                    type="checkbox"
                                    checked={matchingConfig.visibility === 'visible'}
                                    onChange={() => toggle(widget.id)}
                                    value={widget.id}
                                />
                                <span>
                                    {widget.id}
                                </span>
                            </label>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
