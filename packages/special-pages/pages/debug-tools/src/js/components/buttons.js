import styles from "./button.module.css";
// @ts-ignore
import cn from 'classnames'

export function MicroButton (props) {
    const { children, className, ...rest } = props
    return (
        <button
            type="button"
            className={cn(styles.button, className)}
            data-variant="micro"
            {...rest}>
            {children}
        </button>
    )
}

export function Button (props) {
    const { children, className, ...rest } = props
    return (
        <button
            type="button"
            className={cn(styles.button, className)}
            {...rest}>
            {children}
        </button>
    )
}
