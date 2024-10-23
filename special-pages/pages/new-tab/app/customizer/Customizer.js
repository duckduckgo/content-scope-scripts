import { h } from 'preact'
import { useContext, useEffect, useRef, useState, useCallback, useId } from 'preact/hooks'
import { WidgetConfigContext } from '../widget-list/widget-config.provider.js'
import styles from './Customizer.module.css'
import { VisibilityMenu } from './VisibilityMenu.js'
import { CustomizeIcon } from '../components/Icons.js'
import cn from 'classnames'

/**
 * @import { Widgets, WidgetConfigItem } from '../../../../types/new-tab.js'
 */

/**
 * Represents the NTP customizer. For now it's just the ability to toggle sections.
 */
export function Customizer () {
    const { widgetConfigItems, toggle } = useContext(WidgetConfigContext)
    const { setIsOpen, buttonRef, dropdownRef, isOpen } = useDropdown()
    const [rowData, setRowData] = useState(/** @type {VisibilityRowData[]} */([]))

    /**
     * Dispatch an event every time the customizer is opened - this
     * allows widgets to register themselves and provide
     */
    const toggleMenu = useCallback(() => {
        if (isOpen) return setIsOpen(false)
        /** @type {VisibilityRowData[]} */
        const next = []
        const detail = {
            register: (/** @type {VisibilityRowData} */incoming) => {
                next.push(structuredClone(incoming))
            }
        }
        const event = new CustomEvent(Customizer.OPEN_EVENT, { detail })
        window.dispatchEvent(event)
        setRowData(next)
        setIsOpen(true)
    }, [isOpen])

    /**
     * Compute the current state of each registered row
     */
    const visibilityState = rowData.map(row => {
        const item = widgetConfigItems.find(w => w.id === row.id)
        if (!item) console.warn('could not find', row.id)
        return {
            checked: item?.visibility === 'visible'
        }
    })

    const MENU_ID = useId()
    const BUTTON_ID = useId()

    return (
        <div class={styles.root} ref={dropdownRef}>
            <CustomizerButton
                buttonId={BUTTON_ID}
                menuId={MENU_ID}
                toggleMenu={toggleMenu}
                buttonRef={buttonRef}
                isOpen={isOpen}
            />
            <div
                id={MENU_ID}
                class={cn(styles.dropdownMenu, { [styles.show]: isOpen })}
                aria-labelledby={BUTTON_ID}
            >
                <VisibilityMenu
                    rows={rowData}
                    state={visibilityState}
                    toggle={toggle}
                />
            </div>
        </div>
    )
}

Customizer.OPEN_EVENT = 'ntp-customizer-open'

/**
 * @param {object} props
 * @param {string} [props.menuId]
 * @param {string} [props.buttonId]
 * @param {boolean} props.isOpen
 * @param {() => void} [props.toggleMenu]
 * @param {import("preact").Ref<HTMLButtonElement>} [props.buttonRef]
 */
export function CustomizerButton ({ menuId, buttonId, isOpen, toggleMenu, buttonRef }) {
    return (
        <button
            ref={buttonRef}
            className={styles.customizeButton}
            onClick={toggleMenu}
            aria-haspopup="true"
            aria-expanded={isOpen}
            aria-controls={menuId}
            id={buttonId}
        >
            <CustomizeIcon/>
            <span>Customize</span>
        </button>
    )
}

export function CustomizerMenuPositionedFixed ({ children }) {
    return (
        <div class={styles.lowerRightFixed}>
            {children}
        </div>
    )
}

function useDropdown () {
    /** @type {import("preact").Ref<HTMLDivElement>} */
    const dropdownRef = useRef(null)
    /** @type {import("preact").Ref<HTMLButtonElement>} */
    const buttonRef = useRef(null)

    const [isOpen, setIsOpen] = useState(false)

    /**
     * Event handlers when it's open
     */
    useEffect(() => {
        if (!isOpen) return
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
    }, [isOpen])

    return { dropdownRef, buttonRef, isOpen, setIsOpen }
}

export class VisibilityRowState {
    checked

    /**
     * @param {object} params
     * @param {boolean} params.checked - whether this item should appear 'checked'
     */
    constructor ({ checked }) {
        this.checked = checked
    }
}

export class VisibilityRowData {
    id
    title
    icon

    /**
     * @param {object} params
     * @param {string} params.id - a unique id
     * @param {string} params.title - the title as it should appear in the menu
     * @param {'shield' | 'star'} params.icon - known icon name, maps to an SVG
     */
    constructor ({ id, title, icon }) {
        this.id = id
        this.title = title
        this.icon = icon
    }
}

/**
 * Call this to opt-in to the visibility menu
 * @param {VisibilityRowData} row
 */
export function useCustomizer ({ title, id, icon }) {
    useEffect(() => {
        const handler = (/** @type {CustomEvent<any>} */e) => {
            e.detail.register({ title, id, icon })
        }
        window.addEventListener(Customizer.OPEN_EVENT, handler)
        return () => window.removeEventListener(Customizer.OPEN_EVENT, handler)
    }, [title, id, icon])
}
