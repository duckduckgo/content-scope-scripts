import { h } from "preact";
import styles from "../src/js/styles.module.css";
import { Typed } from "./Typed";

export function Header({ title, progressMax = 0, progressValue = 0 }) {
  return (
    <header className={styles.header}>
      <img className={styles.logo} />

      <div className={styles.content}>
        <h1 className={styles.title}>
          <Typed text={title} />
        </h1>
      </div>

      {progressMax > 0 && (
        <div className={styles.progressContainer}>
          <div>
            {progressValue + 1} / {progressMax}
          </div>
          <progress max={progressMax} value={progressValue + 1}>
            (Page {progressValue + 1} of circa {progressMax})
          </progress>
        </div>
      )}
    </header>
  );
}
