import { Component } from 'preact'

export class ErrorBoundary extends Component {
    /**
     * @param {{didCatch: (params: {error: Error; info: any}) => void}} props
     */
    constructor (props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError () {
        // Update state so the next render will show the fallback UI.
        return { hasError: true }
    }

    componentDidCatch (error, info) {
        this.props.didCatch({ error, info })
    }

    render () {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback
        }

        return this.props.children
    }
}
