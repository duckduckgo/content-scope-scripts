import { h } from "preact";
import styles from "../src/js/styles.module.css";
import { Typed } from "./Typed";

/**
 * 
 * @param {{title: string, aside?: any}} props 
 * @returns 
 */
export function Header({ title, aside = null }) {
  return (
    <header className={styles.header}>
      <img className={styles.logo} src='assets/img/logo.svg' />

      <div className={styles.titleContainer}>
        <h1 className={styles.title}>
          <Typed text={title} />
        </h1>
      </div>

      {aside}
    </header>
  );
}
