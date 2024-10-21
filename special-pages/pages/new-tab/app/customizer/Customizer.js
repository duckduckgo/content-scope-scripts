import { h } from 'preact'
import { useContext, useEffect, useId, useRef, useState } from 'preact/hooks'
import { WidgetConfigContext } from '../widget-list/widget-config.provider.js'
import styles from './Customizer.module.css'
import cn from 'classnames'
import { CustomizeIcon, DuckFoot, Shield } from '../components/Icons.js'

/**
 * @import { Widgets, WidgetConfigItem } from '../../../../types/new-tab.js'
 */

export function Customizer () {
    const { widgets, widgetConfigItems, toggle } = useContext(WidgetConfigContext)
    const defaultMeta = {
        privacyStats: {
            icon: 'shield',
            title: 'Privacy Stats'
        },
        favorites: {
            icon: 'star',
            title: 'Favorites'
        }
    }
    return <CustomizerMenu
        widgets={widgets}
        widgetConfigItems={widgetConfigItems}
        toggle={toggle}
        metaData={defaultMeta}
    />
}

/**
 * @param {object} props
 * @param {Widgets} props.widgets
 * @param {WidgetConfigItem[]} props.widgetConfigItems
 * @param {(id: string) => void} props.toggle
 * @param {Record<string, {title: string; icon: string}>} props.metaData
 */
export function CustomizerMenu ({ widgets, widgetConfigItems, toggle, metaData }) {
    const [isOpen, setIsOpen] = useState(false)
    /** @type {import("preact").Ref<HTMLDivElement>} */
    const dropdownRef = useRef(null)
    /** @type {import("preact").Ref<HTMLButtonElement>} */
    const buttonRef = useRef(null)

    const MENU_ID = useId()
    const BUTTON_ID = useId()

    const toggleMenu = () => setIsOpen(!isOpen)

    useEffect(() => {
        const handleFocusOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
                setIsOpen(false)
            }
        }
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains?.(event.target)) {
                setIsOpen(false)
            }
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
                buttonRef.current?.focus?.()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('focusin', handleFocusOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('focusin', handleFocusOutside)
        }
    }, [])

    return (
        <div class={styles.root} ref={dropdownRef}>
            <button
                ref={buttonRef}
                class={styles.customizeButton}
                onClick={toggleMenu}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls={MENU_ID}
                id={BUTTON_ID}
            >
                <CustomizeIcon/>
                <span>Customize</span>
            </button>
            <div
                id={MENU_ID}
                class={cn(styles.dropdownMenu, { [styles.show]: isOpen })}
                aria-labelledby={BUTTON_ID}
            >
                <h2 class="sr-only">Customize New Tab Page</h2>
                <ul class={styles.list}>
                    {widgets.map((widget) => {
                        const matchingConfig = widgetConfigItems.find(item => item.id === widget.id)
                        if (!matchingConfig) {
                            console.warn('missing config for widget: ', widget)
                            return null
                        }
                        const meta = metaData[widget.id]

                        return (
                            <li key={widget.id}>
                                <label className={styles.menuItemLabel}>
                                    <input
                                        type="checkbox"
                                        checked={matchingConfig.visibility === 'visible'}
                                        onChange={() => toggle(widget.id)}
                                        className={styles.checkbox}
                                    />
                                    <span class={styles.svg}>
                                        {meta?.icon === 'star' && <DuckFoot />}
                                        {meta?.icon === 'shield' && <Shield />}
                                    </span>
                                    <span>{meta?.title ?? widget.id}</span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export function CustomizerMenuPositionedFixed ({ children }) {
    return (
        <div class={styles.lowerRightFixed}>
            {children}
        </div>
    )
}

export function CustomizerMenuPositioned ({ children }) {
    return (
        <div class={styles.lowerRight}>
            {children}
        </div>
    )
}
