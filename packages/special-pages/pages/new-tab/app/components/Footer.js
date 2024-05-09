import {
  CustomizerContext,
  CustomizerProvider,
  states,
} from "../providers/customizer.provider";
import { h } from "preact";
import { useContext, useRef } from "preact/hooks";
import styles from "./Footer.module.css";
import { useDismiss } from "../hooks/useDismiss";

export function Footer() {
  return (
    <footer class={styles.footer}>
      <CustomizerProvider>
        <CustomizerPopover />
      </CustomizerProvider>
    </footer>
  );
}

/**
 * A wrapper for the trigger buttons and for conditionally attaching the Modal
 */
export function CustomizerPopover() {
  const { state, openCustomizer } = useContext(CustomizerContext);

  return (
    <div class={styles.customizer}>
      <button type={"button"} onClick={openCustomizer}>
        {state.value === states.showing_menu && "Hide Customizer"}
        {state.value === states.showing_button && "Show Customizer"}
      </button>
      {state.value === states.showing_menu && <NewTabPageCustomizerMenu />}
    </div>
  );
}

/**
 * The main UI used in the New Tab Page menu
 */
export function NewTabPageCustomizerMenu() {
  const { closeCustomizer, toggleFeature, state } =
    useContext(CustomizerContext);

  const contentRef = useRef(null);
  useDismiss(contentRef, closeCustomizer);

  return (
    <div class={styles.menu} ref={contentRef}>
      {state.items.map((item) => {
        return (
          <div class={styles.item}>
            <label key={item.id} class={styles.label}>
              <input
                type={"checkbox"}
                checked={item.state === "enabled"}
                onChange={() => toggleFeature(item.id)}
              />
              {item.title}
            </label>
          </div>
        );
      })}
    </div>
  );
}
