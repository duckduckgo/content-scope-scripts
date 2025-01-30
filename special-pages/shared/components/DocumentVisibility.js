import { useContext, useEffect, useState } from 'preact/hooks';
import { createContext, h } from 'preact';

const DocumentVisibilityContext = createContext(
    /** @type {DocumentVisibilityState} */
    ('hidden'),
);

export function DocumentVisibilityProvider({ children }) {
    /** @type {Document['visibilityState']} */
    const initial = document.visibilityState;
    const [documentVisibility, setDocumentVisibility] = useState(/** @type {Document['visibilityState']} */ (initial));

    useEffect(() => {
        const handleVisibilityChange = () => {
            setDocumentVisibility(document.visibilityState);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return <DocumentVisibilityContext.Provider value={documentVisibility}>{children}</DocumentVisibilityContext.Provider>;
}

export function useDocumentVisibility() {
    return useContext(DocumentVisibilityContext);
}
