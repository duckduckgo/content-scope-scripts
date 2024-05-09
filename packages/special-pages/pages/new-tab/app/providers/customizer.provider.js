import { createContext, h } from "preact";
import { useEffect, useReducer } from "preact/hooks";

export const states = {
  showing_button: "showing_button",
  showing_menu: "showing_menu",
  showing_help: "showing_help",
};

export const featureStates = {
  enabled: "enabled",
  disabled: "disabled",
};

const events = {
  OPEN: "OPEN",
  UPDATE: "UPDATE",
  TOGGLE_FEATURE: "TOGGLE_FEATURE",
  CLOSE: "CLOSE",
  SHOW_HELP: "SHOW_HELP",
};

export const CustomizerContext = createContext({
  state: {
    /** @type {states[keyof states]} */
    value: states.showing_button,
    /** @type {CustomizerItem[]} */
    items: [],
  },
  /** @type {(id: string) => any} */
  toggleFeature: (id) => {
    throw new Error("todo: implement toggleFeature");
  },
  /** @type {() => void} */
  closeCustomizer: () => {
    throw new Error("todo: implement closeCustomizer");
  },
  /** @type {() => void} */
  openCustomizer: () => {
    throw new Error("todo: implement openCustomizer");
  },
  /** @type {import('preact/hooks').Dispatch<any>} */
  dispatch: () => {},
});

export function CustomizerProvider(props) {
  const [state, dispatch] = useCustomizerState();

  useEffect(() => {
    const handler = () => {
      dispatch({ type: events.SHOW_HELP });
    };
    const handlerOpen = () => {
      dispatch({ type: events.OPEN });
    };
    window.addEventListener("customizer-show-help", handler);
    window.addEventListener("customizer-show", handlerOpen);
    return () => {
      window.removeEventListener("customizer-show-help", handler);
      window.removeEventListener("customizer-show", handlerOpen);
    };
  }, [dispatch]);

  /**
   * Each feature controls its own 'toggle state' - we just
   * ask for that information when the item is clicked.
   *
   * 1) The custom event is sent, using the feature's ID as a suffix
   * 2) Each feature must perform it's own 'toggle' and store its own state
   * 3) Then, it must reply via the 'next' method with the updated data
   *
   * @param {string} id
   */
  function toggleFeature(id) {
    const event = new CustomEvent("customizer-toggle-" + id, {
      bubbles: true,
      detail: {
        next(value) {
          if (isValidCustomizerItem(value)) {
            dispatch({ type: events.TOGGLE_FEATURE, data: value });
          }
        },
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Whenever the customizer state changes (eg: opened/closed)
   * continuously collect updated items (it was open)
   */
  useEffect(() => {
    let interval;
    if (state.value === states.showing_menu) {
      interval = setInterval(() => {
        dispatch({ type: events.UPDATE });
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [dispatch, state.value]);

  // some derived helper methods
  const closeCustomizer = () => dispatch({ type: events.CLOSE });

  // opening also involves collecting items every time
  const openCustomizer = () => {
    dispatch({ type: events.OPEN });
  };

  return (
    <CustomizerContext.Provider
      value={{
        state,
        dispatch,
        openCustomizer,
        closeCustomizer,
        toggleFeature,
      }}
    >
      {props.children}
    </CustomizerContext.Provider>
  );
}

/**
 * Static method for triggering the help modal
 */
CustomizerProvider.showHelp = () => {
  window.dispatchEvent(new CustomEvent("customizer-show-help"));
};
CustomizerProvider.show = () => {
  window.dispatchEvent(new CustomEvent("customizer-show"));
};

/**
 * Handle the various events that can occur with the Customizer
 * such as open/close, updating, toggling etc.
 */
function useCustomizerState(initialState) {
  const state = initialState || {
    value: states.showing_button,
    items: [],
  };
  return useReducer((state, action) => {
    /**
     * Always transition back to `showing_button` when a 'CLOSE' event happens
     */
    if (action.type === events.CLOSE) {
      return {
        ...state,
        value: states.showing_button,
      };
    }
    switch (state.value) {
      /**
       * You can only transition to 'showing_menu' or 'showing_help' when it's currently closed (showing the button)
       */
      case states.showing_button: {
        /**
         * If we get here, the customizer should be opened if we have a list of
         * features to display in the menu. Note: The list could be empty in
         * certain testing scenarios
         */
        if (action.type === events.OPEN) {
          // prettier-ignore
          const nextItems = Array.isArray(action.data)
                        ? action.data
                        : collectItems().sort(sorter);
          return { ...state, value: states.showing_menu, items: nextItems };
        }
        if (action.type === events.SHOW_HELP) {
          return { ...state, value: states.showing_help };
        }
        return state;
      }
      /**
       * Handle events when the menu is open
       */
      case states.showing_menu: {
        /**
         * If another 'OPEN' event is received, it's like just another click on the
         * button - so treat it as a toggle
         */
        if (action.type === events.OPEN) {
          return { ...state, value: states.showing_button };
        }

        /**
         * UPDATE events happen when the menu is open, and we've re-issued the
         * customizer-collection event. This allows features to register themselves
         * whilst the menu is already open - for example, the Tracker Stats needs this
         * on the first open of Chrome.
         */
        if (action.type === events.UPDATE) {
          // prettier-ignore
          const nextItems = Array.isArray(action.data)
                        ? action.data
                        : collectItems().sort(sorter);

          return { ...state, value: states.showing_menu, items: nextItems };
        }

        /**
         * Finally, a `TOGGLE_FEATURE` event means we can replace a menu item
         * with a new version of itself. Each feature might have different toggling
         * strategies, so we just wholesale assign the new item
         */
        if (action.type === events.TOGGLE_FEATURE) {
          const items = state.items
            .map((item) => {
              if (item.id === action.data.id) {
                return action.data;
              }
              return item;
            })
            .sort(sorter);
          return { ...state, items };
        }
        return state;
      }
      /**
       * If we're currently `showing_help` all we can do is received another
       * 'OPEN' event.
       */
      case states.showing_help: {
        if (action.type === events.OPEN) {
          const items = collectItems().sort(sorter);
          return { ...state, value: states.showing_menu, items: items };
        }
        return state;
      }
      default:
        return state;
    }
  }, state);
}

/**
 * Dispatch a CustomEvent on Window to allow features on the page
 * to register themselves with the customizer menu.
 *
 * All the event bubbling occurs synchronously, so by the time
 * we get to `dispatchEvent`, all features will have had chance
 * to register.
 *
 * @return {CustomizerItem[]}
 */
function collectItems() {
  let items = [];
  const event = new CustomEvent("customizer-collector", {
    cancelable: false,
    detail: {
      add(item) {
        if (isValidCustomizerItem(item)) {
          items.push(item);
        } // otherwise, ignore it
      },
    },
  });

  // set initial items
  window.dispatchEvent(event);
  return items;
}

function sorter(a, b) {
  return a.order - b.order;
}

/**
 * @typedef CustomizerItem
 * @property {string} id
 * @property {string} title
 * @property {string} icon
 * @property {string} desc
 * @property {'enabled' | 'disabled'} state
 * @property {number} order
 */

/**
 * Validate an incoming object to ensure it matches a `CustomizerItem`.
 * todo(Shane): Can we introduce some runtime verification here?
 *
 * @param {Record<string, any>} input
 * @returns {input is CustomizerItem}
 */
function isValidCustomizerItem(input) {
  if (!input) return false;
  const requiredStrings = ["id", "title", "icon", "desc"];
  const requiredNumbers = ["order"];

  for (let requiredString of requiredStrings) {
    if (typeof input[requiredString] !== "string") {
      return false;
    }
  }

  for (let requiredNumber of requiredNumbers) {
    if (typeof input[requiredNumber] !== "number") {
      return false;
    }
  }

  if (input.state !== "enabled" && input.state !== "disabled") {
    return false;
  }

  return true;
}

// /**
//  * @param {object} props
//  * @param {CustomizerItem[]} props.items
//  * @param {keyof states} props.initialState
//  */
// export function TestCustomizerProvider(props) {
//     const initialState = {
//         value: props.initialState || states.showing_menu,
//         items: props.items || [],
//     };
//
//     const [state, dispatch] = useCustomizerState(initialState);
//     const closeCustomizer = () => dispatch({ type: events.CLOSE });
//     const openCustomizer = () => dispatch({ type: events.OPEN, data: state.items });
//     const toggleFeature = () => {};
//
//     return (
//         <CustomizerContext.Provider
//             value={{
//                 state,
//                 dispatch,
//                 closeCustomizer,
//                 openCustomizer,
//                 toggleFeature,
//             }}
//         >
//             {props.children}
//         </CustomizerContext.Provider>
//     );
// }
