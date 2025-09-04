import { h, createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { signal } from '@preact/signals';

/**
 * @typedef {import("preact").ComponentChild} ComponentChild
 */

/**
 * @typedef {Object} SlotFillRegistration
 * @property {string} slotName - The name of the slot
 * @property {ComponentChild} content - The content to render in the slot
 */

// Global signal to manage slot-fill registrations
const slotFillState = signal(/** @type {Map<string, ComponentChild>} */ (new Map()));

const SlotFillContext = createContext(slotFillState);

/**
 * Provider component that manages the slot-fill system
 * @param {object} props
 * @param {ComponentChild} props.children
 */
export function SlotFillProvider({ children }) {
    return <SlotFillContext.Provider value={slotFillState}>{children}</SlotFillContext.Provider>;
}

/**
 * Slot component that renders content provided by Fill components
 * @param {object} props
 * @param {string} props.name - The name of the slot
 */
export function Slot({ name }) {
    const slotFillMap = useContext(SlotFillContext);
    const content = slotFillMap.value.get(name);
    return content || null;
}

/**
 * Fill component that provides content to a named slot
 * @param {object} props
 * @param {string} props.slot - The name of the slot to fill
 * @param {ComponentChild} props.children - The content to render in the slot
 */
export function Fill({ slot, children }) {
    const slotFillMap = useContext(SlotFillContext);
    
    useEffect(() => {
        // Register this fill with the slot
        const currentMap = new Map(slotFillMap.value);
        currentMap.set(slot, children);
        slotFillMap.value = currentMap;
        
        // Cleanup when component unmounts
        return () => {
            const currentMap = new Map(slotFillMap.value);
            currentMap.delete(slot);
            slotFillMap.value = currentMap;
        };
    }, [slot, children, slotFillMap]);
    
    // Fill components don't render anything directly
    return null;
}