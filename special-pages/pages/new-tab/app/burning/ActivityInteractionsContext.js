import { createContext } from 'preact';

export const ActivityInteractionsContext = createContext({
    /**
     * @type {(evt: MouseEvent) => void} event
     */
    didClick(event) {},
});
