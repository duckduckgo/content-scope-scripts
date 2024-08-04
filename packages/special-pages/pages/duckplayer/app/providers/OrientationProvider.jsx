import { h } from "preact";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { createContext } from "preact";
import { FocusMode } from "../components/FocusMode.jsx";

const OrientationContext = createContext(/** @type {"landscape" | "portrait"} */("portrait"))

/**
 * Device orientation
 *
 * @param {Object} props - The props for the settings provider.
 * @param {import("preact").ComponentChild} props.children - The children components to be wrapped by the settings provider.
 */
export function OrientationProvider ({ children }) {
    const [orientation, setOrientation] = useState(() => getOrientationFromWidth())

    useEffect(() => {
        const handleOrientationChange = () => {
            setOrientation(getOrientationFromScreen());
        };
        screen.orientation.addEventListener('change', handleOrientationChange);
        return () => screen.orientation.removeEventListener('change', handleOrientationChange);
    }, []);

    useEffect(() => {
        let timer;
        const listener = () => {
            clearTimeout(timer);
            timer = setTimeout(() => setOrientation(getOrientationFromWidth()), 300)
        }
        window.addEventListener('resize', listener)
        return () => window.removeEventListener('resize', listener)
    }, [])

    useEffect(() => {
        document.body.dataset.orientation = orientation
        if (orientation === "portrait") FocusMode.enable()
        if (orientation === "landscape") FocusMode.disable()
    }, [orientation])

    return <OrientationContext.Provider value={orientation}>
        {children}
    </OrientationContext.Provider>
}


/**
 * Retrieves the current orientation of the screen.
 *
 * The orientation can either be 'portrait' or 'landscape' based on the height and width of the window.
 *
 * If the height of the window is greater than 500, then the orientation is considered 'portrait'. Otherwise,
 * if the screen.orientation.type includes the word 'landscape', then the orientation is considered 'landscape'.
 * Otherwise, the orientation is 'portrait'.
 *
 * @return {"portrait" | "landscape"} The current orientation of the screen. It can be either 'portrait' or 'landscape'.
 */
function getOrientationFromWidth() {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

/**
 * @return {"portrait" | "landscape"} The current orientation of the screen. It can be either 'portrait' or 'landscape'.
 */
function getOrientationFromScreen() {
    return screen.orientation.type.includes('landscape')
        ? 'landscape'
        : 'portrait'
}

export function useOrientation() {
    return useContext(OrientationContext)
}
