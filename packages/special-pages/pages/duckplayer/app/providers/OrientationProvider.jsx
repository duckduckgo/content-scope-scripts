import { h } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { createContext } from "preact";

const OrientationContext = createContext(/** @type {"landscape" | "portrait"} */("portrait"))

/**
 * Device orientation
 *
 * @param {Object} props - The props for the settings provider.
 * @param {import("preact").ComponentChild} props.children - The children components to be wrapped by the settings provider.
 */
export function OrientationProvider ({ children }) {
    const [orientation, setTheme] = useState(() => {
        const initial = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        return /** @type {"landscape"|"portrait"} */(initial)
    })

    useEffect(() => {
        const listener = (e) => setTheme(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
        window.addEventListener('resize', listener)
        return () => window.removeEventListener('resize', listener)
    }, [])

    useEffect(() => {
        document.body.dataset.orientation = orientation
    }, [orientation])

    return <OrientationContext.Provider value={orientation}>
        {children}
    </OrientationContext.Provider>
}

export function useOrientation() {
    return useContext(OrientationContext)
}
