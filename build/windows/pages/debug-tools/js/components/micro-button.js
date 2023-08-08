export function MicroButton (props) {
    const { children, className, ...rest } = props
    return (
        <button
            type="button"
            className={['button'].concat(className || '').join(' ')}
            data-variant="micro"
            {...rest}>
            {children}
        </button>
    )
}
