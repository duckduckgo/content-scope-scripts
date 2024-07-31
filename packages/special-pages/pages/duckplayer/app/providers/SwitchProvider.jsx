import { createContext, h } from "preact";
import { useEffect, useReducer } from "preact/hooks";
import { useEnv } from "../../../../shared/components/EnvironmentProvider.js";
import { useSetEnabled, useUserValues } from "./UserValuesProvider.jsx";


/**
 * @typedef {'showing' | 'exiting' | 'completed'} SwitchState
 * @typedef {'change' | 'done' | 'enabled' | 'ask'} SwitchEvent
 */

export const SwitchContext = createContext({
    /** @type {SwitchState} */
    state: 'showing',
    /** @type {() => void} */
    onChange: () => {
        throw new Error('must implement')
    },
    /** @type {() => void} */
    onDone: () => {
        throw new Error('must implement')
    },
})

export function SwitchProvider({ children }) {
    const { isReducedMotion } = useEnv();
    const userValues = useUserValues();
    const setEnabled = useSetEnabled();
    const initialState = 'enabled' in userValues.privatePlayerMode ? 'completed' : 'showing'

    const [state, dispatch] = useReducer((/** @type {SwitchState} */state, /** @type {SwitchEvent} */event) => {
        console.log("📩", {state,event})
        switch (state) {
            case "showing": {
                if (event === 'change') {
                    return 'exiting'
                }
                if (event === 'enabled') {
                    return 'completed'
                }
                if (event === 'done') {
                    return 'completed'
                }
                break;
            }
            case "exiting": {
                if (event === 'done') {
                    return 'completed'
                }
                break;
            }
            case "completed": {
                if (event === 'ask') {
                    return 'showing'
                }
            }
        }
        return state
    }, initialState);

    function onChange() {
        if (isReducedMotion) {
            dispatch('done')
        } else {
            dispatch('change')
        }
    }

    // sync the userValues with the state of the switch
    useEffect(() => {
        const evt = 'enabled' in userValues.privatePlayerMode ? 'enabled' : 'ask'
        dispatch(evt);
    }, [initialState])

    // when the switch is 'completed', reflect that fact to a body attribute,
    // this allows certain screen sizes to alter their layout.
    useEffect(() => {
        if (state === 'completed') {
            document.body.dataset.player = 'enabled'
            setEnabled()
        }
    }, [state])

    function onDone() {
        dispatch('done')
    }

    return (
        <SwitchContext.Provider value={{state, onChange, onDone}}>
            {children}
        </SwitchContext.Provider>
    )
}
