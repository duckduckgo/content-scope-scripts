export function InlineDL (props) {
    const { children, ...rest } = props
    return <dl className="inline-dl text-xs font-mono" {...rest}>{children}</dl>
}

export function DT (props) {
    const { children, ...rest } = props
    return <dt className="inline-dl__dt" {...rest}>{children}</dt>
}

export function DD (props) {
    const { children, ...rest } = props
    return <dd className="inline-dl__dd" {...rest}>{children}</dd>
}
