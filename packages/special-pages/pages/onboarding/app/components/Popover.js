import { h } from 'preact'
import styles from './Popover.module.css'
import { Button } from './Buttons'
import { BlackCheck, ChevronDown } from './Icons'
import { useEffect, useRef, useState } from 'preact/hooks'
import { useTranslation } from '../translations'

/**
 * A dropdown component for the home button.
 *
 * @param {Object} props - The props object.
 * @param {(value: import('../types').HomeButtonPosition) => void} props.setEnabled - The function to call when a dropdown item is selected.
 * @param {'long' | 'short'} [props.label]
 */
export function HomeButtonDropdown ({ setEnabled, label = 'long' }) {
    const ref = useRef(/** @type {HTMLDivElement | null} */(null))
    const { t } = useTranslation()
    const [isOpen, setOpen] = useState(false)

    function toggle () {
        setOpen(prev => !prev)
    }
    /** @type {(value: import('../types').HomeButtonPosition) => void} */
    function onSelect (value) {
        if (value === 'hidden') {
            setOpen(false)
        }
        if (value === 'left' || value === 'right') {
            setEnabled(value)
        }
    }
    const triggerLabel = label === 'long' ? t('Show Home Button') : t('Home Button')
    return (
        <Popover isOpen={isOpen}
            id={'dropdown-01'}
            trigger={
                <Button
                    aria-expanded={isOpen}
                    variant={'secondary'}
                    onClick={toggle}>{triggerLabel} <ChevronDown/>
                </Button>
            }>
            <EscapeKey onPress={toggle} contentRef={ref} />
            <div className={styles.homeButtonDropdown} ref={ref}>
                <ul>
                    <li>
                        <button className={styles.button} type={'button'} onClick={() => onSelect('hidden')}>
                            <span className={styles.check}><BlackCheck/></span>
                            {t('Hide')}
                        </button>
                    </li>
                    <li>
                        <button className={styles.button} type={'button'} onClick={() => onSelect('left')}>
                            {t('Show left of the back button')}
                        </button>
                    </li>
                    <li>
                        <button className={styles.button} type={'button'} onClick={() => onSelect('right')}>
                            {t('Show right of the reload button')}
                        </button>
                    </li>
                </ul>
            </div>
        </Popover>
    )
}

function Popover ({ trigger, id, isOpen, children }) {
    return <div className={styles.popover}>
        {trigger}
        <div className={styles.content}
            role={'dialog'}
            tabindex={-1}
            aria-labelledby={id}
            data-is-open={isOpen}>{isOpen && children}</div>
    </div>
}

function EscapeKey ({ onPress, contentRef }) {
    useEffect(() => {
        const clickOutside = (e) => {
            if (!contentRef.current?.contains(e.target)) {
                onPress()
            }
        }
        const handler = (e) => {
            if (e.code === 'Escape') onPress()
        }
        window.addEventListener('keydown', handler)
        window.addEventListener('click', clickOutside)
        return () => {
            window.removeEventListener('keydown', handler)
            window.removeEventListener('click', clickOutside)
        }
    }, [onPress])
    return null
}
